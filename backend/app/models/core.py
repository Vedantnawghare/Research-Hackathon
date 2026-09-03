from datetime import datetime
from enum import Enum

from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# =========================================================
# ENUMS
# =========================================================

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"


class PatientStatus(str, Enum):
    STABLE = "STABLE"
    ATTENTION = "ATTENTION"
    HIGH_RISK = "HIGH_RISK"
    CRITICAL = "CRITICAL"


class TaskStatus(str, Enum):
    UPCOMING = "UPCOMING"
    DUE = "DUE"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"
    MISSED = "MISSED"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True
    )

    hashed_password: Mapped[str] = mapped_column(String(255))

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.NURSE
    )

    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    specialty: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    shift: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# PATIENT
# =========================================================

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    patient_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True
    )

    full_name: Mapped[str] = mapped_column(String(150))

    age: Mapped[int] = mapped_column(Integer)

    gender: Mapped[str] = mapped_column(String(20))

    contact: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    ward: Mapped[str] = mapped_column(String(100))

    bed_number: Mapped[str] = mapped_column(
        String(50),
        unique=True
    )

    admission_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    assigned_doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    assigned_doctor: Mapped["User | None"] = relationship()

    current_status: Mapped[PatientStatus] = mapped_column(
        SQLEnum(PatientStatus),
        default=PatientStatus.STABLE
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# MONITORING PLAN
# =========================================================

class MonitoringPlan(Base):
    __tablename__ = "monitoring_plans"

    id: Mapped[int] = mapped_column(primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id")
    )

    vital_name: Mapped[str] = mapped_column(String(100))

    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    frequency_minutes: Mapped[int] = mapped_column(Integer)

    warning_low: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    warning_high: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    critical_low: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    critical_high: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    patient: Mapped["Patient"] = relationship()


# =========================================================
# OBSERVATION TASK
# =========================================================

class ObservationTask(Base):
    __tablename__ = "observation_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id")
    )

    vital_name: Mapped[str] = mapped_column(String(100))

    scheduled_time: Mapped[datetime] = mapped_column(DateTime)

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.UPCOMING
    )

    assigned_nurse_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    patient: Mapped["Patient"] = relationship()
    assigned_nurse: Mapped["User | None"] = relationship()


# =========================================================
# VITAL RECORD
# =========================================================

class VitalRecord(Base):
    __tablename__ = "vital_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"),
        index=True
    )

    recorded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    heart_rate: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    systolic_bp: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    diastolic_bp: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    respiratory_rate: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    spo2: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    blood_glucose: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    urine_output: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    patient: Mapped["Patient"] = relationship()
    recorded_by: Mapped["User | None"] = relationship()


# =========================================================
# ALERT
# =========================================================

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"),
        index=True
    )

    vital_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("vital_records.id"),
        nullable=True
    )

    vital_name: Mapped[str] = mapped_column(String(100))

    current_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    threshold_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    severity: Mapped[AlertSeverity] = mapped_column(
        SQLEnum(AlertSeverity)
    )

    status: Mapped[AlertStatus] = mapped_column(
        SQLEnum(AlertStatus),
        default=AlertStatus.ACTIVE
    )

    message: Mapped[str] = mapped_column(Text)

    acknowledged_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    patient: Mapped["Patient"] = relationship()
    vital_record: Mapped["VitalRecord | None"] = relationship()
    acknowledged_by: Mapped["User | None"] = relationship()


# =========================================================
# AUDIT LOG
# =========================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    patient_id: Mapped[int | None] = mapped_column(
        ForeignKey("patients.id"),
        nullable=True
    )

    action: Mapped[str] = mapped_column(String(150))

    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user: Mapped["User | None"] = relationship()
    patient: Mapped["Patient | None"] = relationship()


# =========================================================
# SHIFT HANDOVER RECORD
# =========================================================

class ShiftHandoverRecord(Base):
    __tablename__ = "shift_handovers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shift_date: Mapped[str] = mapped_column(String(50))
    shift_type: Mapped[str] = mapped_column(String(100))

    outgoing_nurse_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    incoming_nurse_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    outgoing_nurse_name: Mapped[str] = mapped_column(String(150))
    incoming_nurse_name: Mapped[str] = mapped_column(String(150))

    total_completed_observations: Mapped[int] = mapped_column(Integer, default=0)
    pending_observations: Mapped[int] = mapped_column(Integer, default=0)
    missed_observations: Mapped[int] = mapped_column(Integer, default=0)
    active_alerts_count: Mapped[int] = mapped_column(Integer, default=0)

    handover_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)