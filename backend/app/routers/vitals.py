from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import (
    Patient,
    VitalRecord,
    MonitoringPlan,
    Alert,
    PatientStatus,
    AlertSeverity,
)
from app.schemas.core import (
    VitalRecordCreate,
    VitalRecordResponse,
)
from app.services.audit import create_audit_log
from app.services.vital_engine import evaluate_vital


router = APIRouter(
    prefix="/vitals",
    tags=["Vitals"]
)


@router.post(
    "/",
    response_model=VitalRecordResponse
)
def record_vitals(
    vital_data: VitalRecordCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VERIFY PATIENT
    # -----------------------------------------------------

    patient = db.query(Patient).filter(
        Patient.id == vital_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # -----------------------------------------------------
    # SAVE VITAL RECORD
    # -----------------------------------------------------

    vital_record = VitalRecord(
        **vital_data.model_dump()
    )

    db.add(vital_record)
    db.flush()

    # -----------------------------------------------------
    # FETCH PATIENT'S ACTIVE MONITORING PLANS
    # -----------------------------------------------------

    monitoring_plans = db.query(
        MonitoringPlan
    ).filter(
        MonitoringPlan.patient_id
        == patient.id,

        MonitoringPlan.is_enabled
        == True
    ).all()

    # -----------------------------------------------------
    # MAP DATABASE VITAL NAMES TO INPUT VALUES
    # -----------------------------------------------------

    vital_values = {
        "heart_rate": vital_data.heart_rate,
        "systolic_bp": vital_data.systolic_bp,
        "diastolic_bp": vital_data.diastolic_bp,
        "temperature": vital_data.temperature,
        "respiratory_rate": vital_data.respiratory_rate,
        "spo2": vital_data.spo2,
        "blood_glucose": vital_data.blood_glucose,
        "urine_output": vital_data.urine_output,
    }

    highest_severity = None

    # -----------------------------------------------------
    # EVALUATE EVERY CONFIGURED VITAL
    # -----------------------------------------------------

    for plan in monitoring_plans:

        value = vital_values.get(
            plan.vital_name
        )

        evaluation = evaluate_vital(
            value,
            plan
        )

        if evaluation:

            alert = Alert(
                patient_id=patient.id,
                vital_record_id=vital_record.id,
                vital_name=plan.vital_name,
                current_value=value,
                threshold_value=evaluation[
                    "threshold"
                ],
                severity=evaluation[
                    "severity"
                ],
                message=evaluation[
                    "message"
                ],
            )

            db.add(alert)

            # Track highest severity
            if (
                evaluation["severity"]
                == AlertSeverity.CRITICAL
            ):
                highest_severity = (
                    AlertSeverity.CRITICAL
                )

            elif (
                evaluation["severity"]
                == AlertSeverity.WARNING
                and highest_severity is None
            ):
                highest_severity = (
                    AlertSeverity.WARNING
                )

    # -----------------------------------------------------
    # UPDATE PATIENT STATUS
    # -----------------------------------------------------

    if highest_severity == AlertSeverity.CRITICAL:
        patient.current_status = PatientStatus.CRITICAL

    elif highest_severity == AlertSeverity.WARNING:
        patient.current_status = (
            PatientStatus.HIGH_RISK
        )

    else:
        patient.current_status = PatientStatus.STABLE


    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    create_audit_log(
        db=db,
        action="VITALS_RECORDED",
        patient_id=patient.id,
        user_id=vital_data.recorded_by_id,
        details="New vital signs recorded and evaluated"
    )

    db.commit()

    db.refresh(vital_record)

    return vital_record

# =========================================================
# GET VITAL HISTORY FOR A PATIENT
# =========================================================

@router.get(
    "/patient/{patient_id}",
    response_model=list[VitalRecordResponse]
)
def get_patient_vitals(
    patient_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):

    # Verify patient
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Get vital records, newest first
    vitals = db.query(
        VitalRecord
    ).filter(
        VitalRecord.patient_id == patient_id
    ).order_by(
        VitalRecord.recorded_at.desc()
    ).limit(
        limit
    ).all()

    return vitals


# =========================================================
# GET LATEST VITAL RECORD FOR A PATIENT
# =========================================================

@router.get(
    "/patient/{patient_id}/latest",
    response_model=VitalRecordResponse
)
def get_latest_vitals(
    patient_id: int,
    db: Session = Depends(get_db)
):

    # Verify patient
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Get most recent vital record
    vital = db.query(
        VitalRecord
    ).filter(
        VitalRecord.patient_id == patient_id
    ).order_by(
        VitalRecord.recorded_at.desc()
    ).first()

    if not vital:
        raise HTTPException(
            status_code=404,
            detail="No vital records found for this patient"
        )

    return vital