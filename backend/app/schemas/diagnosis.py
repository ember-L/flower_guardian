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
    detections: str = "[]"  # 检测结果JSON，包含bbox和标签信息


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
    conversation_id: Optional[int] = None
    detections: Optional[str] = None  # 检测结果JSON
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisRecordListResponse(BaseModel):
    total: int
    items: List[DiagnosisRecordResponse]
