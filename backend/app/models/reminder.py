from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    type = Column(String(20))
    interval_days = Column(Integer, default=7)
    enabled = Column(Boolean, default=True)
    last_done = Column(DateTime)
    next_due = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reminders")
    user_plant = relationship("UserPlant", back_populates="reminders")
