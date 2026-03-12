from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DiagnosisRecordCreate(BaseModel):
    image_url: str
    disease_name: str
    confidence: float
    description: str = ""
    treatment: str = ""
    prevention: str = ""
    recommended_products: str = "[]"


class DiagnosisRecordResponse(BaseModel):
    id: int
    image_url: str
    disease_name: str
    confidence: float
    description: str
    treatment: str
    prevention: str
    recommended_products: str
    is_favorite: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisRecordListResponse(BaseModel):
    total: int
    items: List[DiagnosisRecordResponse]
