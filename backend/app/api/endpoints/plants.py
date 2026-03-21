from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from calendar import monthrange
import os
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.plant import Plant, UserPlant, CareRecord, GrowthRecord, HealthRecord, PlantPhoto
from app.models.reminder import Reminder
from app.schemas.plant import (
    PlantResponse, UserPlantCreate, UserPlantResponse, PlantListResponse,
    CareRecordCreate, CareRecordResponse,
    GrowthRecordCreate, GrowthRecordResponse,
    HealthRecordCreate, HealthRecordResponse,
    UserPlantUpdate, ReminderUpdate
)

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


# ========== 静态路由必须放在动态路由 /{plant_id} 之前 ==========

# 测试端点
@router.get("/test")
def test_endpoint():
    return {"message": "Backend is working!"}


# 用户植物 - POST
@router.post("/my", response_model=UserPlantResponse)
def add_user_plant(
    plant: UserPlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    # 检查用户是否已认证
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

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


# 用户植物列表 - GET
@router.get("/my", response_model=list[UserPlantResponse])
def get_my_plants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    import traceback
    try:
        print(f"[DEBUG] get_my_plants called, user: {current_user.username if current_user else 'None'}")
        if not current_user:
            return []
        plants = db.query(UserPlant).filter(
            UserPlant.user_id == current_user.id
        ).offset(skip).limit(limit).all()
        return plants
    except Exception as e:
        print(f"[ERROR] get_my_plants: {e}")
        traceback.print_exc()
        raise


# ========== /my 路由必须在 /{plant_id} 之前 ==========

# 花园统计
@router.get("/my/stats")
def get_garden_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取花园统计数据"""
    if not current_user:
        return {
            "total_plants": 0,
            "this_month_cares": 0,
            "health_distribution": {"good": 0, "fair": 0, "sick": 0},
            "location_distribution": {}
        }

    plants = db.query(UserPlant).filter(UserPlant.user_id == current_user.id).all()
    total_plants = len(plants)

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    care_count = db.query(CareRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id,
        CareRecord.created_at >= month_start
    ).count()

    health_dist = {"good": 0, "fair": 0, "sick": 0}
    latest_health = db.query(HealthRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id
    ).order_by(HealthRecord.created_at.desc()).all()

    latest_by_plant = {}
    for h in latest_health:
        if h.user_plant_id not in latest_by_plant:
            latest_by_plant[h.user_plant_id] = h.health_status

    for status in latest_by_plant.values():
        if status in health_dist:
            health_dist[status] += 1

    loc_dist = {}
    for p in plants:
        loc = p.location or 'other'
        loc_dist[loc] = loc_dist.get(loc, 0) + 1

    return {
        "total_plants": total_plants,
        "this_month_cares": care_count,
        "health_distribution": health_dist,
        "location_distribution": loc_dist
    }


@router.get("/my/calendar")
def get_care_calendar(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取养护日历数据"""
    if not current_user:
        return {"year": 0, "month": 0, "days": {}}

    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month

    _, last_day = monthrange(year, month)
    month_start = datetime(year, month, 1)
    month_end = datetime(year, month, last_day, 23, 59, 59)

    records = db.query(CareRecord).join(UserPlant).filter(
        UserPlant.user_id == current_user.id,
        CareRecord.created_at >= month_start,
        CareRecord.created_at <= month_end
    ).order_by(CareRecord.created_at.desc()).all()

    days = {}
    for r in records:
        day = r.created_at.day
        if day not in days:
            days[day] = []
        days[day].append({
            "id": r.id,
            "care_type": r.care_type,
            "notes": r.notes
        })

    return {"year": year, "month": month, "days": days}


# ========== 动态路由 /{plant_id} ==========
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


@router.delete("/my/{user_plant_id}")
def delete_user_plant(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """删除用户的植物"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    db.delete(user_plant)
    db.commit()
    return {"message": "Plant deleted successfully"}


@router.get("/my/{user_plant_id}", response_model=UserPlantResponse)
def get_user_plant(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取单个用户植物"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return user_plant


@router.put("/my/{user_plant_id}", response_model=UserPlantResponse)
def update_user_plant(
    user_plant_id: int,
    plant_update: UserPlantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """更新用户植物信息"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    update_data = plant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user_plant, key, value)

    db.commit()
    db.refresh(user_plant)
    return user_plant


# 养护记录 API
@router.get("/my/{user_plant_id}/care-records", response_model=list[CareRecordResponse])
def get_care_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取养护记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(CareRecord).filter(
        CareRecord.user_plant_id == user_plant_id
    ).order_by(CareRecord.created_at.desc()).all()
    return records


@router.post("/my/{user_plant_id}/care-records", response_model=CareRecordResponse)
def add_care_record(
    user_plant_id: int,
    care_record: CareRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """添加养护记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = CareRecord(
        user_plant_id=user_plant_id,
        care_type=care_record.care_type,
        notes=care_record.notes
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


# 生长记录 API
@router.get("/my/{user_plant_id}/growth-records", response_model=list[GrowthRecordResponse])
def get_growth_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取生长记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(GrowthRecord).filter(
        GrowthRecord.user_plant_id == user_plant_id
    ).order_by(GrowthRecord.record_date.desc()).all()
    return records


@router.post("/my/{user_plant_id}/growth-records", response_model=GrowthRecordResponse)
def add_growth_record(
    user_plant_id: int,
    growth_record: GrowthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """添加生长记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = GrowthRecord(
        user_plant_id=user_plant_id,
        height=growth_record.height,
        leaf_count=growth_record.leaf_count,
        flower_count=growth_record.flower_count,
        description=growth_record.description,
        image_url=growth_record.image_url
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


# 健康记录 API
@router.get("/my/{user_plant_id}/health-records", response_model=list[HealthRecordResponse])
def get_health_records(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取健康记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    records = db.query(HealthRecord).filter(
        HealthRecord.user_plant_id == user_plant_id
    ).order_by(HealthRecord.created_at.desc()).all()
    return records


@router.post("/my/{user_plant_id}/health-records", response_model=HealthRecordResponse)
def add_health_record(
    user_plant_id: int,
    health_record: HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """添加健康记录"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not user_plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    new_record = HealthRecord(
        user_plant_id=user_plant_id,
        health_status=health_record.health_status,
        pest_info=health_record.pest_info,
        treatment=health_record.treatment
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


# ========== 照片 API ==========

@router.post("/my/{user_plant_id}/photo")
async def upload_plant_photo(
    user_plant_id: int,
    photo_type: str = Query("growth"),
    description: str = Query(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """上传植物照片"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 验证植物归属
    plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 保存文件
    upload_dir = os.path.join("backend", "uploads", "plants")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # 保存记录
    photo = PlantPhoto(
        user_plant_id=user_plant_id,
        photo_url=f"/uploads/plants/{filename}",
        photo_type=photo_type,
        description=description
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {"id": photo.id, "photo_url": photo.photo_url}


@router.get("/my/{user_plant_id}/photos")
def get_plant_photos(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取植物照片列表"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    photos = db.query(PlantPhoto).filter(
        PlantPhoto.user_plant_id == user_plant_id
    ).order_by(PlantPhoto.created_at.desc()).all()

    return photos


# ========== 提醒 API ==========

@router.get("/my/{user_plant_id}/reminders")
def get_plant_reminders(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取植物提醒设置"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    reminders = db.query(Reminder).filter(
        Reminder.user_plant_id == user_plant_id,
        Reminder.user_id == current_user.id
    ).all()

    return reminders


@router.put("/my/{user_plant_id}/reminders")
def update_plant_reminder(
    user_plant_id: int,
    reminder_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """更新植物提醒设置"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    reminder = db.query(Reminder).filter(
        Reminder.user_plant_id == user_plant_id,
        Reminder.user_id == current_user.id,
        Reminder.type == reminder_data.type
    ).first()

    if not reminder:
        # 创建新提醒
        reminder = Reminder(
            user_id=current_user.id,
            user_plant_id=user_plant_id,
            type=reminder_data.type,
            interval_days=reminder_data.interval_days,
            enabled=reminder_data.enabled
        )
        db.add(reminder)
    else:
        reminder.interval_days = reminder_data.interval_days
        reminder.enabled = reminder_data.enabled

    db.commit()
    db.refresh(reminder)

    return reminder


# ========== 智能提醒 API ==========

@router.post("/my/{user_plant_id}/reminders/calculate")
def calculate_next_reminder(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """根据养护记录自动计算下次提醒时间"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 验证植物归属
    plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 获取该植物的养护记录
    care_records = db.query(CareRecord).filter(
        CareRecord.user_plant_id == user_plant_id
    ).order_by(CareRecord.created_at.desc()).all()

    if not care_records:
        return {
            "message": "暂无养护记录，无法计算提醒",
            "suggestions": {
                "watering": {"interval_days": 7, "reason": "默认7天浇水"},
                "fertilizing": {"interval_days": 30, "reason": "默认30天施肥"}
            }
        }

    # 计算每种养护类型的平均间隔
    from collections import defaultdict
    care_intervals = defaultdict(list)

    # 按类型分组
    records_by_type = defaultdict(list)
    for record in care_records:
        records_by_type[record.care_type].append(record)

    # 计算每种类型的建议间隔
    suggestions = {}
    for care_type, records in records_by_type.items():
        if len(records) >= 2:
            # 计算相邻记录的平均间隔
            intervals = []
            sorted_records = sorted(records, key=lambda x: x.created_at)
            for i in range(len(sorted_records) - 1):
                delta = (sorted_records[i].created_at - sorted_records[i+1].created_at).days
                if delta > 0:
                    intervals.append(delta)

            if intervals:
                avg_interval = sum(intervals) // len(intervals)
                suggestions[care_type] = {
                    "interval_days": avg_interval,
                    "reason": f"基于{len(intervals)}次养护记录计算"
                }
        else:
            # 只有一条记录，使用默认间隔
            defaults = {
                "watering": 7,
                "fertilizing": 30,
                "repotting": 180,
                "pruning": 60,
                "pest_control": 30
            }
            suggestions[care_type] = {
                "interval_days": defaults.get(care_type, 14),
                "reason": "基于单次记录，建议观察后调整"
            }

    return {
        "plant_name": plant.nickname or plant.plant_name,
        "suggestions": suggestions,
        "recent_records": [
            {
                "type": r.care_type,
                "date": r.created_at.isoformat()
            }
            for r in care_records[:5]
        ]
    }


@router.post("/my/{user_plant_id}/reminders/auto-setup")
def auto_setup_reminders(
    user_plant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """根据养护记录自动设置提醒"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 验证植物归属
    plant = db.query(UserPlant).filter(
        UserPlant.id == user_plant_id,
        UserPlant.user_id == current_user.id
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 获取养护记录
    care_records = db.query(CareRecord).filter(
        CareRecord.user_plant_id == user_plant_id
    ).order_by(CareRecord.created_at.desc()).all()

    # 计算每种类型的间隔
    records_by_type = defaultdict(list)
    for record in care_records:
        records_by_type[record.care_type].append(record)

    created_reminders = []

    for care_type, records in records_by_type.items():
        interval_days = 7  # 默认

        if len(records) >= 2:
            sorted_records = sorted(records, key=lambda x: x.created_at)
            intervals = []
            for i in range(len(sorted_records) - 1):
                delta = (sorted_records[i].created_at - sorted_records[i+1].created_at).days
                if delta > 0:
                    intervals.append(delta)
            if intervals:
                interval_days = sum(intervals) // len(intervals)

        # 检查是否已存在提醒
        existing = db.query(Reminder).filter(
            Reminder.user_plant_id == user_plant_id,
            Reminder.type == care_type
        ).first()

        if existing:
            existing.interval_days = interval_days
            existing.enabled = True
            db.refresh(existing)
            created_reminders.append({
                "type": care_type,
                "interval_days": interval_days,
                "action": "updated"
            })
        else:
            new_reminder = Reminder(
                user_id=current_user.id,
                user_plant_id=user_plant_id,
                type=care_type,
                interval_days=interval_days,
                enabled=True
            )
            db.add(new_reminder)
            created_reminders.append({
                "type": care_type,
                "interval_days": interval_days,
                "action": "created"
            })

    db.commit()

    return {
        "message": f"已自动设置{len(created_reminders)}个提醒",
        "reminders": created_reminders
    }


@router.get("/my/reminders/upcoming")
def get_upcoming_reminders(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """获取即将到期的提醒"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from datetime import timedelta

    now = datetime.utcnow()
    future_date = now + timedelta(days=days)

    # 获取用户的植物和提醒
    plants = db.query(UserPlant).filter(UserPlant.user_id == current_user.id).all()
    plant_ids = [p.id for p in plants]

    reminders = db.query(Reminder).filter(
        Reminder.user_plant_id.in_(plant_ids),
        Reminder.enabled == True,
        Reminder.next_due <= future_date,
        Reminder.next_due >= now
    ).order_by(Reminder.next_due.asc()).all()

    result = []
    for r in reminders:
        plant = next((p for p in plants if p.id == r.user_plant_id), None)
        result.append({
            "id": r.id,
            "plant_name": plant.nickname or plant.plant_name if plant else "未知",
            "type": r.type,
            "interval_days": r.interval_days,
            "next_due": r.next_due.isoformat() if r.next_due else None,
            "days_until": (r.next_due - now).days if r.next_due else None
        })

    return {
        "total": len(result),
        "reminders": result
    }
