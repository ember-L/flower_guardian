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


class SmartReminderCreate(ReminderBase):
    """智能提醒创建"""
    user_plant_id: int
    plant_id: Optional[int] = None
    location: Optional[str] = None
    notify_time: Optional[str] = "09:00"


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    user_plant_id: int
    last_done: Optional[datetime] = None
    next_due: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SmartReminderResponse(ReminderResponse):
    """智能提醒响应"""
    plant_id: Optional[int] = None
    base_interval: Optional[int] = None
    weather_factor: Optional[float] = None
    season_factor: Optional[float] = None
    calculated_interval: Optional[int] = None
    location: Optional[str] = None
    notify_time: Optional[str] = None
    plant_name: Optional[str] = None
    weather_tip: Optional[str] = None
