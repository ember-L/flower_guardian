from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
import json


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
    plant_name: Optional[str] = None  # 关联的植物名称

    model_config = ConfigDict(from_attributes=True)

    @field_validator('images', mode='before')
    @classmethod
    def parse_images(cls, v):
        """将数据库存储的 JSON 字符串转换为列表"""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except json.JSONDecodeError:
                return []
        return []


class DiaryUpdate(BaseModel):
    content: Optional[str] = None
    images: Optional[List[str]] = None
    height: Optional[int] = None
    leaf_count: Optional[int] = None
