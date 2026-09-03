from sqlalchemy.orm import Session

from app.models.core import AuditLog


def create_audit_log(
    db: Session,
    action: str,
    user_id: int | None = None,
    patient_id: int | None = None,
    details: str | None = None,
):
    log = AuditLog(
        user_id=user_id,
        patient_id=patient_id,
        action=action,
        details=details,
    )

    db.add(log)