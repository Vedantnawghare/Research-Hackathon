from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import MonitoringPlan, Patient
from app.schemas.core import (
    MonitoringPlanCreate,
    MonitoringPlanResponse,
)
from app.services.audit import create_audit_log


router = APIRouter(
    prefix="/monitoring-plans",
    tags=["Monitoring Plans"]
)


# =========================================================
# CREATE MONITORING PLAN
# =========================================================

@router.post("/", response_model=MonitoringPlanResponse)
def create_monitoring_plan(
    plan: MonitoringPlanCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == plan.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    existing_plan = db.query(MonitoringPlan).filter(
        MonitoringPlan.patient_id == plan.patient_id,
        MonitoringPlan.vital_name == plan.vital_name
    ).first()

    if existing_plan:
        raise HTTPException(
            status_code=400,
            detail="Monitoring plan already exists for this vital"
        )

    new_plan = MonitoringPlan(
        patient_id=plan.patient_id,
        vital_name=plan.vital_name,
        is_enabled=plan.is_enabled,
        frequency_minutes=plan.frequency_minutes,
        warning_low=plan.warning_low,
        warning_high=plan.warning_high,
        critical_low=plan.critical_low,
        critical_high=plan.critical_high,
    )

    db.add(new_plan)
    db.flush()

    create_audit_log(
        db=db,
        action="MONITORING_PLAN_CREATED",
        patient_id=plan.patient_id,
        details=(
            f"Monitoring configured for {plan.vital_name} "
            f"every {plan.frequency_minutes} minutes"
        )
    )

    db.commit()
    db.refresh(new_plan)

    return new_plan


# =========================================================
# GET ALL PLANS FOR A PATIENT
# =========================================================

@router.get(
    "/patient/{patient_id}",
    response_model=list[MonitoringPlanResponse]
)
def get_patient_monitoring_plans(
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

    return db.query(MonitoringPlan).filter(
        MonitoringPlan.patient_id == patient_id
    ).all()


# =========================================================
# DELETE MONITORING PLAN
# =========================================================

@router.delete("/{plan_id}")
def delete_monitoring_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):
    plan = db.query(MonitoringPlan).filter(
        MonitoringPlan.id == plan_id
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Monitoring plan not found"
        )

    patient_id = plan.patient_id
    vital_name = plan.vital_name

    db.delete(plan)

    create_audit_log(
        db=db,
        action="MONITORING_PLAN_DELETED",
        patient_id=patient_id,
        details=f"Monitoring plan deleted for {vital_name}"
    )

    db.commit()

    return {
        "message": "Monitoring plan deleted successfully"
    }