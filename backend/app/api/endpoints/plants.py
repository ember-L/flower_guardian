from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plant import Plant, UserPlant
from app.schemas.plant import PlantResponse, UserPlantCreate, UserPlantResponse, PlantListResponse

router = APIRouter(prefix="/api/plants", tags=["plants"])


@router.get("", response_model=PlantListResponse)
def list_plants(
    category: Optional[str] = None,
    care_level: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Plant)
    if category:
        query = query.filter(Plant.category == category)
    if care_level:
        query = query.filter(Plant.care_level == care_level)
    if search:
        query = query.filter(Plant.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.post("/my", response_model=UserPlantResponse)
def add_user_plant(
    plant: UserPlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_user_plant = UserPlant(user_id=current_user.id, **plant.model_dump())
    db.add(new_user_plant)
    db.commit()
    db.refresh(new_user_plant)
    return new_user_plant


@router.get("/my", response_model=list[UserPlantResponse])
def get_my_plants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(UserPlant).filter(UserPlant.user_id == current_user.id).all()
