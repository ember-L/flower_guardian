from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PlantBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    yolo_class_id: Optional[int] = None
    care_level: int = 1
    beginner_friendly: Optional[int] = 3
    description: Optional[str] = None
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None
    watering_tip: Optional[str] = None
    temperature_range: Optional[str] = None
    humidity_range: Optional[str] = None
    is_toxic: Optional[bool] = False
    features: Optional[List[str]] = None
    survival_rate: Optional[int] = 90
    tips: Optional[str] = None
    common_mistakes: Optional[str] = None


class PlantResponse(PlantBase):
    id: int

    class Config:
        from_attributes = True


class UserPlantCreate(BaseModel):
    plant_name: Optional[str] = None
    plant_type: Optional[str] = None
    plant_id: Optional[int] = None  # 新增：关联基础植物
    nickname: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    acquired_from: Optional[str] = "manual"
    notes: Optional[str] = None


class UserPlantResponse(UserPlantCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlantListResponse(BaseModel):
    total: int
    items: List[PlantResponse]


# 养护记录
class CareRecordCreate(BaseModel):
    care_type: str
    notes: Optional[str] = None


class CareRecordResponse(CareRecordCreate):
    id: int
    user_plant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# 生长记录
class GrowthRecordCreate(BaseModel):
    height: Optional[int] = None
    leaf_count: Optional[int] = None
    flower_count: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class GrowthRecordResponse(GrowthRecordCreate):
    id: int
    user_plant_id: int
    record_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# 健康记录
class HealthRecordCreate(BaseModel):
    health_status: str
    pest_info: Optional[str] = None
    treatment: Optional[str] = None


class HealthRecordResponse(HealthRecordCreate):
    id: int
    user_plant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# 用户植物更新
class UserPlantUpdate(BaseModel):
    plant_name: Optional[str] = None
    plant_type: Optional[str] = None
    nickname: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


# 提醒更新
class ReminderUpdate(BaseModel):
    type: str
    interval_days: Optional[int] = 7
    enabled: Optional[bool] = True
