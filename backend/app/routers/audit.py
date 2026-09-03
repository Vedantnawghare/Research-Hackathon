from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import AuditLog
from app.schemas.core import AuditLogResponse

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = Query(default=None),
    patient_id: Optional[int] = Query(default=None),
    action: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if patient_id is not None:
        query = query.filter(AuditLog.patient_id == patient_id)

    if action is not None:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
