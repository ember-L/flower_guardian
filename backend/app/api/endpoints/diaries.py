from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.diary import Diary
from app.schemas.diary import DiaryCreate, DiaryResponse

router = APIRouter(prefix="/api/diaries", tags=["diaries"])


@router.get("", response_model=List[DiaryResponse])
def get_diaries(
    plant_id: int = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Diary).filter(Diary.user_id == current_user.id)
    if plant_id:
        query = query.filter(Diary.user_plant_id == plant_id)
    return query.order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=DiaryResponse)
def create_diary(
    diary: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_diary = Diary(user_id=current_user.id, **diary.model_dump())
    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)
    return new_diary


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    diary = db.query(Diary).filter(
        Diary.id == diary_id,
        Diary.user_id == current_user.id
    ).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    return diary
