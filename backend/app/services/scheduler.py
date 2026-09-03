from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.core import (
    MonitoringPlan,
    ObservationTask,
    TaskStatus,
    Alert,
    AlertSeverity,
    AlertStatus,
    Patient,
)
from app.services.audit import create_audit_log


def run_monitoring_scheduler(db: Session):
    """
    Executes automated scheduler routines:
    1. Generates recurring observation tasks from active doctor monitoring plans.
    2. Detects missed/overdue observations and creates missed observation alerts.
    3. Escalates unacknowledged critical alerts to doctor notification queue.
    """
    now = datetime.utcnow()

    # 1. GENERATE OBSERVATION TASKS FROM PLANS
    active_plans = db.query(MonitoringPlan).filter(MonitoringPlan.is_enabled == True).all()

    for plan in active_plans:
        # Check latest task for this patient and vital
        latest_task = db.query(ObservationTask).filter(
            ObservationTask.patient_id == plan.patient_id,
            ObservationTask.vital_name == plan.vital_name
        ).order_by(ObservationTask.scheduled_time.desc()).first()

        # If no task exists, schedule one for now
        if not latest_task:
            next_time = now
        else:
            next_time = latest_task.scheduled_time + timedelta(minutes=plan.frequency_minutes)

        # Schedule tasks up to 1 hour ahead
        if next_time <= now + timedelta(hours=1):
            # Verify no pending task at exact same window
            existing_pending = db.query(ObservationTask).filter(
                ObservationTask.patient_id == plan.patient_id,
                ObservationTask.vital_name == plan.vital_name,
                ObservationTask.status.in_([TaskStatus.UPCOMING, TaskStatus.DUE])
            ).first()

            if not existing_pending:
                patient = db.query(Patient).filter(Patient.id == plan.patient_id).first()
                nurse_id = patient.assigned_doctor_id if patient else None

                new_task = ObservationTask(
                    patient_id=plan.patient_id,
                    vital_name=plan.vital_name,
                    scheduled_time=next_time,
                    assigned_nurse_id=nurse_id,
                    status=TaskStatus.UPCOMING if next_time > now else TaskStatus.DUE
                )
                db.add(new_task)

    # 2. DETECT MISSED & OVERDUE OBSERVATIONS
    due_tasks = db.query(ObservationTask).filter(
        ObservationTask.status.in_([TaskStatus.UPCOMING, TaskStatus.DUE]),
        ObservationTask.scheduled_time < (now - timedelta(minutes=15))
    ).all()

    for task in due_tasks:
        overdue_minutes = int((now - task.scheduled_time).total_seconds() / 60)

        if overdue_minutes > 45:
            task.status = TaskStatus.MISSED
        else:
            task.status = TaskStatus.OVERDUE

        # Create Missed Observation Alert if not already created
        existing_alert = db.query(Alert).filter(
            Alert.patient_id == task.patient_id,
            Alert.vital_name == task.vital_name,
            Alert.status == AlertStatus.ACTIVE,
            Alert.message.ilike("%overdue%") | Alert.message.ilike("%missed%")
        ).first()

        if not existing_alert:
            alert = Alert(
                patient_id=task.patient_id,
                vital_name=task.vital_name,
                severity=AlertSeverity.WARNING if task.status == TaskStatus.OVERDUE else AlertSeverity.CRITICAL,
                status=AlertStatus.ACTIVE,
                message=f"Observation for {task.vital_name} is {task.status.value.lower()} ({overdue_minutes} mins past scheduled time)."
            )
            db.add(alert)
            create_audit_log(
                db=db,
                action="MISSED_OBSERVATION_ALERT",
                patient_id=task.patient_id,
                details=f"Observation task for {task.vital_name} flagged as {task.status.value}"
            )

    # 3. ESCALATE CRITICAL ALERTS TO DOCTOR
    unacknowledged_criticals = db.query(Alert).filter(
        Alert.severity == AlertSeverity.CRITICAL,
        Alert.status == AlertStatus.ACTIVE,
        Alert.created_at < (now - timedelta(minutes=10))
    ).all()

    for alert in unacknowledged_criticals:
        alert.status = AlertStatus.ESCALATED
        create_audit_log(
            db=db,
            action="ALERT_ESCALATED",
            patient_id=alert.patient_id,
            details=f"Critical alert for {alert.vital_name} escalated to assigned doctor (In-App / SMS notification triggered)."
        )

    # 4. OPERATIONAL CHECK: CRITICAL PATIENT WITHOUT ASSIGNED DOCTOR
    from app.models.core import PatientStatus, VitalRecord
    unassigned_critical_patients = db.query(Patient).filter(
        Patient.is_active == True,
        Patient.assigned_doctor_id == None,
        Patient.current_status.in_([PatientStatus.CRITICAL, PatientStatus.HIGH_RISK])
    ).all()

    for p in unassigned_critical_patients:
        existing_alert = db.query(Alert).filter(
            Alert.patient_id == p.id,
            Alert.vital_name == "doctor_assignment",
            Alert.status == AlertStatus.ACTIVE
        ).first()

        if not existing_alert:
            alert = Alert(
                patient_id=p.id,
                vital_name="doctor_assignment",
                severity=AlertSeverity.CRITICAL,
                status=AlertStatus.ACTIVE,
                message=f"CRITICAL PATIENT WITHOUT ASSIGNED DOCTOR: Patient {p.full_name} ({p.bed_number}) is marked {p.current_status.value} but has no assigned doctor. Action: Assign a doctor immediately."
            )
            db.add(alert)

    # 5. OPERATIONAL CHECK: DEVICE / SENSOR OFFLINE (NO TRANSMISSION IN > 30 MINS)
    active_patients = db.query(Patient).filter(Patient.is_active == True).all()
    for p in active_patients:
        latest_vital = db.query(VitalRecord).filter(
            VitalRecord.patient_id == p.id
        ).order_by(VitalRecord.recorded_at.desc()).first()

        if latest_vital and (now - latest_vital.recorded_at).total_seconds() > 1800:
            mins_offline = int((now - latest_vital.recorded_at).total_seconds() / 60)
            existing_alert = db.query(Alert).filter(
                Alert.patient_id == p.id,
                Alert.vital_name == "sensor_telemetry",
                Alert.status == AlertStatus.ACTIVE
            ).first()

            if not existing_alert:
                alert = Alert(
                    patient_id=p.id,
                    vital_name="sensor_telemetry",
                    severity=AlertSeverity.WARNING,
                    status=AlertStatus.ACTIVE,
                    message=f"DEVICE OFFLINE: Bedside telemetry device for {p.full_name} ({p.bed_number}) has not transmitted data for {mins_offline} minutes."
                )
                db.add(alert)

    db.commit()
