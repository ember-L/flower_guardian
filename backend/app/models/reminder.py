from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    type = Column(String(20))
    interval_days = Column(Integer, default=7)
    base_interval = Column(Integer, nullable=True)
    weather_factor = Column(Float, default=1.0)
    season_factor = Column(Float, default=1.0)
    calculated_interval = Column(Integer, nullable=True)
    location = Column(String(100), nullable=True)
    notify_time = Column(String(5), default="09:00")
    enabled = Column(Boolean, default=True)
    last_done = Column(DateTime)
    next_due = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reminders")
    user_plant = relationship("UserPlant", back_populates="reminders")
    plant = relationship("Plant")
