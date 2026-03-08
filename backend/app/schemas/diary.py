from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DiaryCreate(BaseModel):
    user_plant_id: int
    content: str
    images: Optional[List[str]] = None
    height: Optional[int] = None
    leaf_count: Optional[int] = None


class DiaryResponse(DiaryCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
