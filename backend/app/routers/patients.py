from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.core import Patient
from app.schemas.core import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
)
from app.services.audit import create_audit_log


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


# =========================================================
# CREATE PATIENT
# =========================================================

@router.post("/", response_model=PatientResponse)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    existing_code = db.query(Patient).filter(
        Patient.patient_code == patient.patient_code
    ).first()

    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Patient code already exists"
        )

    existing_bed = db.query(Patient).filter(
        Patient.bed_number == patient.bed_number,
        Patient.is_active == True
    ).first()

    if existing_bed:
        raise HTTPException(
            status_code=400,
            detail="Bed is already assigned to another active patient"
        )

    new_patient = Patient(
        patient_code=patient.patient_code,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        contact=patient.contact,
        ward=patient.ward,
        bed_number=patient.bed_number,
        assigned_doctor_id=patient.assigned_doctor_id,
    )

    db.add(new_patient)
    db.flush()

    # Automatically create default monitoring plans for all core vitals
    from app.models.core import MonitoringPlan, Alert, AlertSeverity, AlertStatus
    default_vitals = [
        ("heart_rate", 15, 60, 100, 50, 120),
        ("systolic_bp", 15, 100, 140, 90, 160),
        ("spo2", 15, 94, 100, 90, 100),
        ("temperature", 60, 36.0, 37.5, 35.0, 38.5),
        ("respiratory_rate", 30, 12, 20, 10, 26),
    ]

    for vname, freq, w_low, w_high, c_low, c_high in default_vitals:
        plan = MonitoringPlan(
            patient_id=new_patient.id,
            vital_name=vname,
            frequency_minutes=freq,
            warning_low=w_low,
            warning_high=w_high,
            critical_low=c_low,
            critical_high=c_high,
            is_enabled=True,
        )
        db.add(plan)

    # If no doctor assigned, generate operational alert
    if not new_patient.assigned_doctor_id:
        alert = Alert(
            patient_id=new_patient.id,
            vital_name="doctor_assignment",
            severity=AlertSeverity.WARNING,
            status=AlertStatus.ACTIVE,
            message=f"UNASSIGNED DOCTOR WARNING: Patient {new_patient.full_name} admitted without an assigned physician."
        )
        db.add(alert)

    create_audit_log(
        db=db,
        action="PATIENT_CREATED",
        patient_id=new_patient.id,
        details=f"Patient {new_patient.full_name} admitted to {new_patient.ward}, bed {new_patient.bed_number}"
    )

    db.commit()
    db.refresh(new_patient)

    return new_patient


# =========================================================
# GET ALL PATIENTS
# =========================================================

@router.get("/", response_model=list[PatientResponse])
def get_patients(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    ward: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Patient).filter(
        Patient.is_active == True
    )

    if search:
        query = query.filter(
            or_(
                Patient.full_name.ilike(f"%{search}%"),
                Patient.patient_code.ilike(f"%{search}%"),
                Patient.bed_number.ilike(f"%{search}%")
            )
        )

    if status:
        query = query.filter(
            Patient.current_status == status
        )

    if ward:
        query = query.filter(
            Patient.ward.ilike(f"%{ward}%")
        )

    return query.order_by(
        Patient.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE PATIENT
# =========================================================

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient


# =========================================================
# UPDATE PATIENT
# =========================================================

@router.patch(
    "/{patient_id}",
    response_model=PatientResponse
)
def update_patient(
    patient_id: int,
    updates: PatientUpdate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    update_data = updates.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(patient, field, value)

    create_audit_log(
        db=db,
        action="PATIENT_UPDATED",
        patient_id=patient.id,
        details=f"Patient record updated: {', '.join(update_data.keys())}"
    )

    db.commit()
    db.refresh(patient)

    return patient