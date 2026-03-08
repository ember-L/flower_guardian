from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()


@router.post("", response_model=ReminderResponse)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    next_due = datetime.utcnow() + timedelta(days=reminder.interval_days)
    new_reminder = Reminder(
        user_id=current_user.id,
        **reminder.model_dump(),
        next_due=next_due
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    update_data = reminder_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)

    if reminder_update.last_done:
        reminder.next_due = reminder.last_done + timedelta(days=reminder.interval_days)

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted"}
