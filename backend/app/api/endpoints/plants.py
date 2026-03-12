from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    beginner_friendly: Optional[int] = None,
    light: Optional[str] = None,
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
    if beginner_friendly:
        query = query.filter(Plant.beginner_friendly >= beginner_friendly)
    if light:
        query = query.filter(Plant.light_requirement == light)
    if search:
        query = query.filter(Plant.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """获取植物分类列表及数量"""
    categories = db.query(
        Plant.category,
        func.count(Plant.id).label("count")
    ).group_by(Plant.category).all()

    category_map = {
        "室内": {"name": "观叶植物", "icon": "leaf"},
        "多肉": {"name": "多肉植物", "icon": "sprout"},
        "开花": {"name": "开花植物", "icon": "flower2"},
        "草本": {"name": "草本植物", "icon": "tree"},
    }

    result = []
    for cat, count in categories:
        info = category_map.get(cat, {"name": cat, "icon": "leaf"})
        result.append({
            "value": cat,
            "name": info["name"],
            "icon": info["icon"],
            "count": count
        })

    return {"categories": result}


@router.get("/popular")
def get_popular_plants(
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """获取热门植物列表，按存活率和新手友好度排序"""
    plants = db.query(Plant).order_by(
        Plant.survival_rate.desc(),
        Plant.beginner_friendly.desc()
    ).limit(limit).all()

    return {"items": plants}


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.get("/{plant_id}/related")
def get_related_plants(
    plant_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """获取相关植物推荐（同一类别）"""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    related = db.query(Plant).filter(
        Plant.category == plant.category,
        Plant.id != plant_id
    ).limit(limit).all()

    return {"items": related}


@router.post("/my", response_model=UserPlantResponse)
def add_user_plant(
    plant: UserPlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 如果提供了 plant_id，获取植物名称
    plant_name = plant.plant_name
    if plant.plant_id:
        base_plant = db.query(Plant).filter(Plant.id == plant.plant_id).first()
        if base_plant:
            plant_name = base_plant.name

    new_user_plant = UserPlant(
        user_id=current_user.id,
        plant_name=plant_name,
        plant_type=plant.plant_type,
        plant_id=plant.plant_id,
        nickname=plant.nickname,
        image_url=plant.image_url,
        location=plant.location,
        acquired_from=plant.acquired_from or "manual",
        notes=plant.notes
    )
    db.add(new_user_plant)
    db.commit()
    db.refresh(new_user_plant)
    return new_user_plant


@router.get("/my", response_model=list[UserPlantResponse])
def get_my_plants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plants = db.query(UserPlant).filter(
        UserPlant.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return plants


@router.delete("/my/{user_plant_id}")
def delete_user_plant(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除用户的植物"""
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    db.delete(user_plant)
    db.commit()
    return {"message": "Plant deleted successfully"}
