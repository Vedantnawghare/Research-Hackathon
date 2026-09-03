"""
Database Seeding Script for SHREEDHA Hospital - Smart ICU Vital Monitoring System.
Populates realistic initial data for Admin, Doctors, Nurses, Patients, Monitoring Plans, Vitals, Alerts, and Audit Logs.
"""

from datetime import datetime, timedelta
import hashlib

from app.database import Base, engine, SessionLocal
from app.models.core import (
    User, UserRole,
    Patient, PatientStatus,
    MonitoringPlan,
    VitalRecord,
    Alert, AlertSeverity, AlertStatus,
    ObservationTask, TaskStatus,
    AuditLog,
)


def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            print("Database already contains data. Seeding skipped.")
            return

        print("Seeding database with SHREEDHA Hospital initial dataset...")

        # 1. SEED USERS WITH EXACT HACKATHON MANUAL NAMES
        admin_user = User(
            full_name="Vedant Nawghare",
            email="admin@shreedha.com",
            hashed_password=hash_pw("admin123"),
            role=UserRole.ADMIN,
            department="Hospital Administration",
            specialty="Chief Systems Admin",
            shift="General (09:00 - 17:00)",
            is_active=True,
        )

        doc1 = User(
            full_name="Dr. Shravani Sadawarte",
            email="shravani@shreedha.com",
            hashed_password=hash_pw("doc123"),
            role=UserRole.DOCTOR,
            department="Critical Care & ICU",
            specialty="Cardiology & Critical Care",
            shift="Day Shift (08:00 - 20:00)",
            is_active=True,
        )

        doc2 = User(
            full_name="Dr. Rajesh Kumar",
            email="rajesh@shreedha.com",
            hashed_password=hash_pw("doc123"),
            role=UserRole.DOCTOR,
            department="Pulmonology",
            specialty="Respiratory Medicine",
            shift="Night Shift (20:00 - 08:00)",
            is_active=True,
        )

        nurse1 = User(
            full_name="Nurse Ananya Marghade",
            email="ananya@shreedha.com",
            hashed_password=hash_pw("nurse123"),
            role=UserRole.NURSE,
            department="ICU Ward A",
            specialty="Critical Care Nursing",
            shift="Day Shift (07:00 - 15:00)",
            is_active=True,
        )

        nurse2 = User(
            full_name="Nurse Sunita Rao",
            email="sunita@shreedha.com",
            hashed_password=hash_pw("nurse123"),
            role=UserRole.NURSE,
            department="ICU Ward B",
            specialty="Pediatric ICU",
            shift="Evening Shift (15:00 - 23:00)",
            is_active=True,
        )

        db.add_all([admin_user, doc1, doc2, nurse1, nurse2])
        db.flush()

        # 2. SEED PATIENTS
        p1 = Patient(
            patient_code="PAT-1001",
            full_name="Rajesh Kumar",
            age=68,
            gender="Male",
            contact="+91 9876543210",
            ward="ICU Ward A",
            bed_number="ICU-01",
            assigned_doctor_id=doc1.id,
            current_status=PatientStatus.CRITICAL,
            admission_date=datetime.utcnow() - timedelta(days=2),
            is_active=True,
        )

        p2 = Patient(
            patient_code="PAT-1002",
            full_name="Vedant Nawghare",
            age=21,
            gender="Male",
            contact="+91 9812345678",
            ward="ICU Ward A",
            bed_number="ICU-02",
            assigned_doctor_id=doc1.id,
            current_status=PatientStatus.CRITICAL,
            admission_date=datetime.utcnow() - timedelta(days=1),
            is_active=True,
        )

        p3 = Patient(
            patient_code="PAT-1003",
            full_name="Suresh Deshmukh",
            age=72,
            gender="Male",
            contact="+91 9988776655",
            ward="ICU Ward B",
            bed_number="ICU-03",
            assigned_doctor_id=doc2.id,
            current_status=PatientStatus.HIGH_RISK,
            admission_date=datetime.utcnow() - timedelta(days=1),
            is_active=True,
        )

        p4 = Patient(
            patient_code="PAT-1004",
            full_name="Smita Sharma",
            age=49,
            gender="Female",
            contact="+91 9765432109",
            ward="ICU Ward B",
            bed_number="ICU-04",
            assigned_doctor_id=None,  # Unassigned intentionally to test alert!
            current_status=PatientStatus.CRITICAL,
            admission_date=datetime.utcnow() - timedelta(hours=6),
            is_active=True,
        )

        p5 = Patient(
            patient_code="PAT-1005",
            full_name="Vikram Singh",
            age=61,
            gender="Male",
            contact="+91 9123456780",
            ward="ICU Ward A",
            bed_number="ICU-05",
            assigned_doctor_id=doc1.id,
            current_status=PatientStatus.STABLE,
            admission_date=datetime.utcnow() - timedelta(hours=12),
            is_active=True,
        )

        db.add_all([p1, p2, p3, p4, p5])
        db.flush()

        # 3. SEED MONITORING PLANS
        plans = []
        for pat in [p1, p2, p3, p4, p5]:
            plans.extend([
                MonitoringPlan(patient_id=pat.id, vital_name="heart_rate", frequency_minutes=15, warning_low=60, warning_high=100, critical_low=50, critical_high=120),
                MonitoringPlan(patient_id=pat.id, vital_name="systolic_bp", frequency_minutes=15, warning_low=100, warning_high=140, critical_low=90, critical_high=160),
                MonitoringPlan(patient_id=pat.id, vital_name="spo2", frequency_minutes=15, warning_low=94, warning_high=100, critical_low=90, critical_high=100),
                MonitoringPlan(patient_id=pat.id, vital_name="temperature", frequency_minutes=60, warning_low=36.0, warning_high=37.5, critical_low=35.0, critical_high=38.5),
            ])
        db.add_all(plans)
        db.flush()

        # 4. SEED VITAL RECORDS & ACTIVE ALERTS
        now = datetime.utcnow()

        # p2 (Vedant Nawghare) has HR 143, SpO2 80, BP 188/88
        v_p2 = VitalRecord(
            patient_id=p2.id,
            recorded_by_id=nurse1.id,
            heart_rate=143,
            systolic_bp=188,
            diastolic_bp=88,
            temperature=35.0,
            respiratory_rate=26,
            spo2=80,
            blood_glucose=210,
            urine_output=40,
            notes="Severe tachycardia & oxygen desaturation observed.",
            recorded_at=now - timedelta(minutes=5)
        )

        # p3 (Suresh Deshmukh) has BP 148/92, HR 105, SpO2 93
        v_p3 = VitalRecord(
            patient_id=p3.id,
            recorded_by_id=nurse1.id,
            heart_rate=105,
            systolic_bp=148,
            diastolic_bp=92,
            temperature=37.6,
            respiratory_rate=22,
            spo2=93,
            blood_glucose=160,
            urine_output=45,
            notes="Hypertension warning observed.",
            recorded_at=now - timedelta(minutes=10)
        )

        # p4 (Smita Sharma - Unassigned)
        v_p4 = VitalRecord(
            patient_id=p4.id,
            recorded_by_id=nurse2.id,
            heart_rate=135,
            systolic_bp=170,
            diastolic_bp=95,
            temperature=38.4,
            respiratory_rate=28,
            spo2=86,
            blood_glucose=230,
            urine_output=30,
            notes="Patient admitted in acute distress. Doctor unassigned!",
            recorded_at=now - timedelta(minutes=15)
        )

        db.add_all([v_p2, v_p3, v_p4])
        db.flush()

        # Create corresponding ACTIVE ALERTS for abnormal vitals
        alerts = [
            # Vedant Nawghare alerts
            Alert(patient_id=p2.id, vital_record_id=v_p2.id, vital_name="heart_rate", current_value=143, threshold_value=120, severity=AlertSeverity.CRITICAL, status=AlertStatus.ACTIVE, message="Heart Rate is critically high: 143 bpm", created_at=now - timedelta(minutes=5)),
            Alert(patient_id=p2.id, vital_record_id=v_p2.id, vital_name="spo2", current_value=80, threshold_value=90, severity=AlertSeverity.CRITICAL, status=AlertStatus.ACTIVE, message="SpO2 is critically low: 80%", created_at=now - timedelta(minutes=5)),
            Alert(patient_id=p2.id, vital_record_id=v_p2.id, vital_name="systolic_bp", current_value=188, threshold_value=160, severity=AlertSeverity.CRITICAL, status=AlertStatus.ACTIVE, message="Systolic BP is critically high: 188 mmHg", created_at=now - timedelta(minutes=5)),

            # Suresh Deshmukh alerts
            Alert(patient_id=p3.id, vital_record_id=v_p3.id, vital_name="systolic_bp", current_value=148, threshold_value=140, severity=AlertSeverity.WARNING, status=AlertStatus.ACTIVE, message="Systolic BP is above warning range: 148 mmHg", created_at=now - timedelta(minutes=10)),
            Alert(patient_id=p3.id, vital_record_id=v_p3.id, vital_name="heart_rate", current_value=105, threshold_value=100, severity=AlertSeverity.WARNING, status=AlertStatus.ACTIVE, message="Heart Rate is above warning range: 105 bpm", created_at=now - timedelta(minutes=10)),

            # Operational alert for Smita Sharma
            Alert(patient_id=p4.id, vital_record_id=v_p4.id, vital_name="doctor_assignment", current_value=0, threshold_value=1, severity=AlertSeverity.CRITICAL, status=AlertStatus.ACTIVE, message="CRITICAL PATIENT WITHOUT ASSIGNED DOCTOR: Smita Sharma is marked Critical but has no assigned doctor.", created_at=now - timedelta(minutes=15)),
            Alert(patient_id=p4.id, vital_record_id=v_p4.id, vital_name="spo2", current_value=86, threshold_value=90, severity=AlertSeverity.CRITICAL, status=AlertStatus.ACTIVE, message="SpO2 is critically low: 86%", created_at=now - timedelta(minutes=15)),
        ]
        db.add_all(alerts)
        db.flush()

        # 5. SEED AUDIT LOGS
        audit_logs = [
            AuditLog(user_id=admin_user.id, action="SYSTEM_INITIALIZED", details="SHREEDHA Hospital - Smart ICU Vital Monitoring System initialized."),
            AuditLog(user_id=doc1.id, patient_id=p2.id, action="MONITORING_PLAN_CREATED", details="Configured q15m SpO2, HR, BP telemetry for Vedant Nawghare."),
            AuditLog(user_id=nurse1.id, patient_id=p2.id, action="VITALS_RECORDED", details="Recorded vitals for Vedant Nawghare: HR 143 bpm, BP 188/88, SpO2 80%."),
            AuditLog(user_id=admin_user.id, patient_id=p4.id, action="PATIENT_ADMITTED", details="Admitted Smita Sharma to ICU Ward B, bed ICU-04 (Doctor Unassigned)."),
        ]
        db.add_all(audit_logs)
        db.commit()

        print("Database seeded successfully for SHREEDHA Hospital!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
