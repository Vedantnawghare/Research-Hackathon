from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.core import (
    UserRole,
    PatientStatus,
    AlertSeverity,
    AlertStatus,
    TaskStatus,
)


# =========================================================
# USER SCHEMAS
# =========================================================

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole
    department: Optional[str] = None
    specialty: Optional[str] = None
    shift: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    specialty: Optional[str] = None
    shift: Optional[str] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = None
    specialty: Optional[str] = None
    shift: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# PATIENT SCHEMAS
# =========================================================

class PatientCreate(BaseModel):
    patient_code: str = Field(min_length=2, max_length=50)
    full_name: str = Field(min_length=2, max_length=150)

    age: int = Field(ge=0, le=130)

    gender: str
    contact: Optional[str] = None

    ward: str
    bed_number: str

    assigned_doctor_id: Optional[int] = None
    primary_diagnosis: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=130)
    gender: Optional[str] = None
    contact: Optional[str] = None

    ward: Optional[str] = None
    bed_number: Optional[str] = None

    assigned_doctor_id: Optional[int] = None
    current_status: Optional[PatientStatus] = None
    primary_diagnosis: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    patient_code: str
    full_name: str
    age: int
    gender: str

    contact: Optional[str] = None

    ward: str
    bed_number: str

    admission_date: datetime

    assigned_doctor_id: Optional[int] = None

    current_status: PatientStatus
    primary_diagnosis: Optional[str] = None

    is_active: bool

    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# MONITORING PLAN SCHEMAS
# =========================================================

class MonitoringPlanCreate(BaseModel):
    patient_id: int

    vital_name: str

    is_enabled: bool = True

    frequency_minutes: int = Field(gt=0)

    warning_low: Optional[float] = None
    warning_high: Optional[float] = None

    critical_low: Optional[float] = None
    critical_high: Optional[float] = None


class MonitoringPlanResponse(BaseModel):
    id: int
    patient_id: int
    vital_name: str

    is_enabled: bool

    frequency_minutes: int

    warning_low: Optional[float] = None
    warning_high: Optional[float] = None

    critical_low: Optional[float] = None
    critical_high: Optional[float] = None

    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# VITAL RECORD SCHEMAS
# =========================================================

class VitalRecordCreate(BaseModel):
    patient_id: int
    recorded_by_id: Optional[int] = None

    heart_rate: Optional[float] = Field(default=None, ge=0)
    systolic_bp: Optional[float] = Field(default=None, ge=0)
    diastolic_bp: Optional[float] = Field(default=None, ge=0)

    temperature: Optional[float] = Field(default=None, ge=0)

    respiratory_rate: Optional[float] = Field(
        default=None,
        ge=0
    )

    spo2: Optional[float] = Field(
        default=None,
        ge=0,
        le=100
    )

    blood_glucose: Optional[float] = Field(
        default=None,
        ge=0
    )

    urine_output: Optional[float] = Field(
        default=None,
        ge=0
    )

    notes: Optional[str] = None


class VitalRecordResponse(BaseModel):
    id: int

    patient_id: int
    recorded_by_id: Optional[int] = None

    heart_rate: Optional[float] = None

    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None

    temperature: Optional[float] = None

    respiratory_rate: Optional[float] = None

    spo2: Optional[float] = None

    blood_glucose: Optional[float] = None

    urine_output: Optional[float] = None

    notes: Optional[str] = None

    recorded_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# ALERT SCHEMAS
# =========================================================

class AlertResponse(BaseModel):
    id: int

    patient_id: int

    vital_record_id: Optional[int] = None

    vital_name: str

    current_value: Optional[float] = None
    threshold_value: Optional[float] = None

    severity: AlertSeverity

    status: AlertStatus

    message: str

    acknowledged_by_id: Optional[int] = None

    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    created_at: datetime

    class Config:
        from_attributes = True


class AlertAction(BaseModel):
    user_id: Optional[int] = None


# =========================================================
# OBSERVATION TASK SCHEMAS
# =========================================================

class ObservationTaskResponse(BaseModel):
    id: int

    patient_id: int

    vital_name: str

    scheduled_time: datetime

    completed_at: Optional[datetime] = None

    status: TaskStatus

    assigned_nurse_id: Optional[int] = None

    class Config:
        from_attributes = True


# =========================================================
# AUDIT LOG SCHEMAS
# =========================================================

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    patient_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# =========================================================
# SHIFT HANDOVER SCHEMAS
# =========================================================

class ShiftHandoverCreate(BaseModel):
    shift_date: str
    shift_type: str
    outgoing_nurse_name: str
    incoming_nurse_name: str
    outgoing_nurse_id: Optional[int] = None
    incoming_nurse_id: Optional[int] = None
    total_completed_observations: int = 0
    pending_observations: int = 0
    missed_observations: int = 0
    active_alerts_count: int = 0
    handover_notes: Optional[str] = None


class ShiftHandoverResponse(BaseModel):
    id: int
    shift_date: str
    shift_type: str
    outgoing_nurse_name: str
    incoming_nurse_name: str
    total_completed_observations: int
    pending_observations: int
    missed_observations: int
    active_alerts_count: int
    handover_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True