from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500))
    disease_name = Column(String(100), nullable=False)
    confidence = Column(Float)
    description = Column(Text)
    treatment = Column(Text)  # 治疗建议
    prevention = Column(Text)  # 预防措施
    recommended_products = Column(Text)  # 推荐产品 (JSON)
    is_favorite = Column(Boolean, default=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)  # 关联AI对话
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="diagnosis_records")
    conversation = relationship("Conversation", backref="diagnosis_records")
