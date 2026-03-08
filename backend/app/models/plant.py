from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    scientific_name = Column(String(150))
    category = Column(String(50))
    care_level = Column(Integer, default=1)
    description = Column(Text)
    light_requirement = Column(String(20))
    water_requirement = Column(String(20))
    temperature_range = Column(String(50))
    humidity_range = Column(String(50))
    fertilization = Column(String(100))
    repotting = Column(String(100))
    common_mistakes = Column(Text)
    tips = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPlant(Base):
    __tablename__ = "user_plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plant_name = Column(String(100), nullable=False)
    plant_type = Column(String(50))
    image_url = Column(String(255))
    location = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_plants")
    reminders = relationship("Reminder", back_populates="user_plant")
    diaries = relationship("Diary", back_populates="user_plant")
