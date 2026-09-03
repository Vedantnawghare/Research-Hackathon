from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import Alert, AlertStatus
from app.schemas.core import AlertResponse, AlertAction
from app.services.audit import create_audit_log


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


# =========================================================
# GET ALERTS
# =========================================================

@router.get("/", response_model=list[AlertResponse])
def get_alerts(
    patient_id: int | None = Query(default=None),
    status: AlertStatus | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if patient_id is not None:
        query = query.filter(
            Alert.patient_id == patient_id
        )

    if status is not None:
        query = query.filter(
            Alert.status == status
        )

    return query.order_by(
        Alert.created_at.desc()
    ).all()


# =========================================================
# GET SINGLE ALERT
# =========================================================

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert


# =========================================================
# ACKNOWLEDGE ALERT
# =========================================================

@router.patch(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse
)
def acknowledge_alert(
    alert_id: int,
    action: AlertAction,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by_id = action.user_id
    alert.acknowledged_at = datetime.utcnow()

    create_audit_log(
        db=db,
        action="ALERT_ACKNOWLEDGED",
        patient_id=alert.patient_id,
        user_id=action.user_id,
        details=f"Alert {alert.id} acknowledged"
    )

    db.commit()
    db.refresh(alert)

    return alert


# =========================================================
# RESOLVE ALERT
# =========================================================

@router.patch(
    "/{alert_id}/resolve",
    response_model=AlertResponse
)
def resolve_alert(
    alert_id: int,
    action: AlertAction,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()

    create_audit_log(
        db=db,
        action="ALERT_RESOLVED",
        patient_id=alert.patient_id,
        user_id=action.user_id,
        details=f"Alert {alert.id} resolved"
    )

    db.commit()
    db.refresh(alert)

    return alert