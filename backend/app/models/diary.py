from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    content = Column(Text, nullable=False)
    images = Column(Text)
    height = Column(Integer)
    leaf_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="diaries")
    user_plant = relationship("UserPlant", back_populates="diaries")
