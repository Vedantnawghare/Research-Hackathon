from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.core import TaskStatus


class ObservationTaskCreate(BaseModel):
    patient_id: int
    vital_name: str
    scheduled_time: datetime
    assigned_nurse_id: Optional[int] = None


class ObservationTaskUpdate(BaseModel):
    assigned_nurse_id: Optional[int] = None
    status: Optional[TaskStatus] = None


class ObservationTaskResponse(BaseModel):
    id: int
    patient_id: int
    vital_name: str
    scheduled_time: datetime
    completed_at: Optional[datetime]
    status: TaskStatus
    assigned_nurse_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)