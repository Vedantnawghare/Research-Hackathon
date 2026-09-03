from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import ObservationTask, Patient, TaskStatus
from app.schemas.tasks import (
    ObservationTaskCreate,
    ObservationTaskUpdate,
    ObservationTaskResponse
)


router = APIRouter(
    prefix="/tasks",
    tags=["Observation Tasks"]
)


# =========================================================
# CREATE TASK
# =========================================================

@router.post("/", response_model=ObservationTaskResponse)
def create_task(
    task_data: ObservationTaskCreate,
    db: Session = Depends(get_db)
):

    patient = db.query(Patient).filter(
        Patient.id == task_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    task = ObservationTask(
        patient_id=task_data.patient_id,
        vital_name=task_data.vital_name,
        scheduled_time=task_data.scheduled_time,
        assigned_nurse_id=task_data.assigned_nurse_id,
        status=TaskStatus.UPCOMING
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# =========================================================
# GET TASKS
# =========================================================

@router.get("/", response_model=list[ObservationTaskResponse])
def get_tasks(
    patient_id: int | None = None,
    status: TaskStatus | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(ObservationTask)

    if patient_id is not None:
        query = query.filter(
            ObservationTask.patient_id == patient_id
        )

    if status is not None:
        query = query.filter(
            ObservationTask.status == status
        )

    tasks = query.order_by(
        ObservationTask.scheduled_time.asc()
    ).all()

    return tasks


# =========================================================
# GET SINGLE TASK
# =========================================================

@router.get("/{task_id}", response_model=ObservationTaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):

    task = db.query(ObservationTask).filter(
        ObservationTask.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# =========================================================
# UPDATE TASK
# =========================================================

@router.patch(
    "/{task_id}",
    response_model=ObservationTaskResponse
)
def update_task(
    task_id: int,
    task_data: ObservationTaskUpdate,
    db: Session = Depends(get_db)
):

    task = db.query(ObservationTask).filter(
        ObservationTask.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    update_data = task_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


# =========================================================
# COMPLETE TASK
# =========================================================

@router.patch(
    "/{task_id}/complete",
    response_model=ObservationTaskResponse
)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db)
):

    task = db.query(ObservationTask).filter(
        ObservationTask.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Task is already completed"
        )

    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return task