from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReminderBase(BaseModel):
    type: str
    interval_days: int = 7
    enabled: bool = True


class ReminderCreate(ReminderBase):
    user_plant_id: int


class ReminderUpdate(BaseModel):
    type: Optional[str] = None
    interval_days: Optional[int] = None
    enabled: Optional[bool] = None
    last_done: Optional[datetime] = None


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    user_plant_id: int
    last_done: Optional[datetime] = None
    next_due: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
