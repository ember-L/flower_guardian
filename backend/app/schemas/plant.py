from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PlantBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    care_level: int = 1
    description: Optional[str] = None


class PlantResponse(PlantBase):
    id: int
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None

    class Config:
        from_attributes = True


class UserPlantCreate(BaseModel):
    plant_name: str
    plant_type: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None


class UserPlantResponse(UserPlantCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlantListResponse(BaseModel):
    total: int
    items: List[PlantResponse]
