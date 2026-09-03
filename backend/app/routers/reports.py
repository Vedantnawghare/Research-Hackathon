from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Patient, VitalRecord, Alert, ShiftHandoverRecord
from app.schemas.core import ShiftHandoverCreate, ShiftHandoverResponse
from app.services.audit import create_audit_log

router = APIRouter(
    prefix="/reports",
    tags=["Reports & Digital ICU Chart"]
)


@router.get("/icu-chart/{patient_id}")
def get_digital_icu_chart(
    patient_id: int,
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    since_time = datetime.utcnow() - timedelta(hours=hours)

    vitals = db.query(VitalRecord).filter(
        VitalRecord.patient_id == patient_id,
        VitalRecord.recorded_at >= since_time
    ).order_by(VitalRecord.recorded_at.asc()).all()

    alerts = db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.created_at >= since_time
    ).order_by(Alert.created_at.desc()).all()

    # Build structured hourly matrix
    vital_rows = []
    for v in vitals:
        vital_rows.append({
            "time": v.recorded_at.strftime("%H:%M"),
            "full_timestamp": v.recorded_at.isoformat(),
            "heart_rate": v.heart_rate,
            "blood_pressure": f"{int(v.systolic_bp)}/{int(v.diastolic_bp)}" if (v.systolic_bp and v.diastolic_bp) else "N/A",
            "systolic_bp": v.systolic_bp,
            "diastolic_bp": v.diastolic_bp,
            "temperature": v.temperature,
            "respiratory_rate": v.respiratory_rate,
            "spo2": v.spo2,
            "glucose": v.blood_glucose,
            "urine_output": v.urine_output,
            "notes": v.notes,
            "recorded_by_id": v.recorded_by_id,
        })

    return {
        "patient": {
            "id": patient.id,
            "patient_code": patient.patient_code,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "ward": patient.ward,
            "bed_number": patient.bed_number,
            "status": patient.current_status,
            "admission_date": patient.admission_date.isoformat(),
        },
        "timeframe_hours": hours,
        "vital_rows": vital_rows,
        "total_records": len(vital_rows),
        "recent_alerts": [
            {
                "id": a.id,
                "vital_name": a.vital_name,
                "severity": a.severity,
                "status": a.status,
                "message": a.message,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ]
    }


@router.post("/shift-handover", response_model=ShiftHandoverResponse)
def create_shift_handover(
    handover: ShiftHandoverCreate,
    db: Session = Depends(get_db)
):
    record = ShiftHandoverRecord(
        shift_date=handover.shift_date,
        shift_type=handover.shift_type,
        outgoing_nurse_id=handover.outgoing_nurse_id,
        incoming_nurse_id=handover.incoming_nurse_id,
        outgoing_nurse_name=handover.outgoing_nurse_name,
        incoming_nurse_name=handover.incoming_nurse_name,
        total_completed_observations=handover.total_completed_observations,
        pending_observations=handover.pending_observations,
        missed_observations=handover.missed_observations,
        active_alerts_count=handover.active_alerts_count,
        handover_notes=handover.handover_notes,
    )

    db.add(record)
    db.flush()

    create_audit_log(
        db=db,
        action="SHIFT_HANDOVER_SUBMITTED",
        details=f"Shift handover saved: {handover.outgoing_nurse_name} -> {handover.incoming_nurse_name} ({handover.shift_type})"
    )

    db.commit()
    db.refresh(record)

    return record


@router.get("/shift-handover", response_model=List[ShiftHandoverResponse])
def get_shift_handovers(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(ShiftHandoverRecord).order_by(ShiftHandoverRecord.created_at.desc()).limit(limit).all()
