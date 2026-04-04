from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.models.plant import Plant, UserPlant
from app.schemas.reminder import (
    ReminderCreate, ReminderUpdate, ReminderResponse,
    SmartReminderCreate, SmartReminderResponse
)
from app.services.reminder_service import (
    calculate_smart_interval, get_season_factor,
    generate_weather_tip, get_weather_factor, WATER_REQUIREMENT_INTERVAL
)
from app.services.weather_service import get_current_weather, get_watering_advice
from app.services.connection_manager import connection_manager

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()


@router.get("/smart", response_model=List[SmartReminderResponse])
def get_smart_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取智能提醒列表"""
    try:
        reminders = db.query(Reminder).filter(
            Reminder.user_id == current_user.id,
            Reminder.enabled == True
        ).all()
    except Exception as e:
        print(f"[ERROR] Query reminders failed: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    result = []
    season_factor = get_season_factor()

    for reminder in reminders:
        try:
            # 获取植物信息
            plant = None
            plant_name = None
            if reminder.plant_id:
                plant = db.query(Plant).filter(Plant.id == reminder.plant_id).first()
                if plant:
                    plant_name = plant.name

            # 计算智能间隔
            if reminder.calculated_interval is None and plant:
                reminder.calculated_interval = calculate_smart_interval(
                    plant, reminder.weather_factor or 1.0, season_factor
                )

            # 生成提示
            weather_tip = None
            if reminder.weather_factor and reminder.weather_factor != 1.0:
                weather_tip = generate_weather_tip(
                    reminder.weather_factor, season_factor
                )

            result.append(SmartReminderResponse(
                id=reminder.id,
                user_id=reminder.user_id,
                user_plant_id=reminder.user_plant_id,
                plant_id=reminder.plant_id,
                type=reminder.type,
                interval_days=reminder.interval_days,
                base_interval=reminder.base_interval,
                weather_factor=reminder.weather_factor,
                season_factor=reminder.season_factor,
                calculated_interval=reminder.calculated_interval,
                location=reminder.location,
                notify_time=reminder.notify_time,
                enabled=reminder.enabled,
                last_done=reminder.last_done,
                next_due=reminder.next_due,
                created_at=reminder.created_at,
                plant_name=plant_name,
                weather_tip=weather_tip
            ))
        except Exception as e:
            print(f"[ERROR] Process reminder {reminder.id} failed: {e}")
            continue

    return result


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


@router.post("/smart", response_model=SmartReminderResponse)
def create_smart_reminder(
    reminder: SmartReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建智能提醒"""
    season_factor = get_season_factor()
    weather_factor = 1.0

    # 获取植物基础间隔
    plant = None
    base_interval = None
    if reminder.plant_id:
        plant = db.query(Plant).filter(Plant.id == reminder.plant_id).first()
        if plant and plant.water_requirement:
            base_interval = WATER_REQUIREMENT_INTERVAL.get(plant.water_requirement, 7)
    else:
        base_interval = reminder.interval_days or 7

    # 计算智能间隔（使用用户设置的间隔作为基础）
    calculated_interval = calculate_smart_interval(
        plant, weather_factor, season_factor, reminder.interval_days
    )

    next_due = datetime.utcnow() + timedelta(days=calculated_interval)

    new_reminder = Reminder(
        user_id=current_user.id,
        user_plant_id=reminder.user_plant_id,
        plant_id=reminder.plant_id,
        type=reminder.type,
        interval_days=reminder.interval_days or 7,
        base_interval=base_interval,
        weather_factor=weather_factor,
        season_factor=season_factor,
        calculated_interval=calculated_interval,
        location=reminder.location,
        notify_time=reminder.notify_time,
        enabled=reminder.enabled,
        next_due=next_due
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    plant_name = plant.name if plant else None

    return SmartReminderResponse(
        id=new_reminder.id,
        user_id=new_reminder.user_id,
        user_plant_id=new_reminder.user_plant_id,
        plant_id=new_reminder.plant_id,
        type=new_reminder.type,
        interval_days=new_reminder.interval_days,
        base_interval=new_reminder.base_interval,
        weather_factor=new_reminder.weather_factor,
        season_factor=new_reminder.season_factor,
        calculated_interval=new_reminder.calculated_interval,
        location=new_reminder.location,
        notify_time=new_reminder.notify_time,
        enabled=new_reminder.enabled,
        last_done=new_reminder.last_done,
        next_due=new_reminder.next_due,
        created_at=new_reminder.created_at,
        plant_name=plant_name
    )


@router.put("/{reminder_id}/complete", response_model=SmartReminderResponse)
async def complete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记完成并重新计算下次提醒"""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # 更新完成时间
    reminder.last_done = datetime.utcnow()

    # 重新计算间隔
    season_factor = get_season_factor()
    weather_factor = reminder.weather_factor or 1.0

    # 获取最新天气
    if reminder.location:
        weather = None
        try:
            weather = await get_current_weather(reminder.location)
        except Exception:
            pass
        if weather:
            weather_factor = get_weather_factor(
                weather.get("temperature"),
                weather.get("humidity"),
                weather.get("precipitation")
            )
            reminder.weather_factor = weather_factor

    # 计算下次提醒
    if reminder.calculated_interval:
        reminder.interval_days = reminder.calculated_interval

    reminder.next_due = datetime.utcnow() + timedelta(
        days=int(reminder.interval_days * season_factor * weather_factor)
    )

    db.commit()
    db.refresh(reminder)

    # 获取植物名称
    plant_name = None
    if reminder.plant_id:
        plant = db.query(Plant).filter(Plant.id == reminder.plant_id).first()
        plant_name = plant.name if plant else None

    return SmartReminderResponse(
        id=reminder.id,
        user_id=reminder.user_id,
        user_plant_id=reminder.user_plant_id,
        plant_id=reminder.plant_id,
        type=reminder.type,
        interval_days=reminder.interval_days,
        base_interval=reminder.base_interval,
        weather_factor=reminder.weather_factor,
        season_factor=reminder.season_factor,
        calculated_interval=reminder.calculated_interval,
        location=reminder.location,
        notify_time=reminder.notify_time,
        enabled=reminder.enabled,
        last_done=reminder.last_done,
        next_due=reminder.next_due,
        created_at=reminder.created_at,
        plant_name=plant_name
    )


@router.get("/weather")
async def get_weather_reminder(
    location: str = Query(..., description="城市名称"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取天气和浇水建议"""
    weather = await get_current_weather(location)

    if not weather:
        return {"error": "无法获取天气数据", "advice": "请稍后重试"}

    advice = get_watering_advice(weather)

    return {
        "weather": weather,
        "advice": advice
    }


# 保留原有端点（兼容）
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


@router.post("/test-push")
async def test_push_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """测试 WebSocket 推送通知功能"""
    title = "🧪 测试推送"
    body = "这是一条 WebSocket 测试推送，收到此消息说明连接正常！"

    success = await connection_manager.push_notification(
        current_user.id,
        {
            "action": "reminder",
            "data": {
                "id": 0,
                "title": title,
                "body": body,
                "reminder_type": "test",
                "plant_name": "测试植物",
            }
        }
    )

    if success:
        return {
            "success": True,
            "message": "测试推送已发送，请检查 App WebSocket 通知"
        }
    else:
        return {
            "success": False,
            "message": "推送发送失败，用户可能没有连接 WebSocket"
        }


@router.post("/broadcast")
async def broadcast_notification(db: Session = Depends(get_db)):
    """广播浇水提醒给需要浇水的用户（无需认证）"""
    from datetime import datetime

    # 查找所有需要浇水的提醒
    now = datetime.now()

    # 查找已到期但未完成的浇水提醒
    reminders = db.query(Reminder).filter(
        Reminder.enabled == True,
        Reminder.type == "water",
        # Reminder.next_due <= now
    ).all()

    sent_count = 0
    for reminder in reminders:
        # 获取用户的植物名称
        plant_name = "您的植物"
        if reminder.user_plant:
            plant_name = reminder.user_plant.nickname or reminder.user_plant.plant_name or plant_name

        # 通过 WebSocket 推送
        result = await connection_manager.push_notification(
            reminder.user_id,
            {
                "action": "reminder",
                "data": {
                    "id": reminder.id,
                    "title": "🌱 养护提醒",
                    "body": f'您的"{plant_name}"需要浇水啦！',
                    "reminder_type": "water",
                    "plant_name": plant_name,
                }
            }
        )
        if result:
            sent_count += 1

    return {
        "success": True,
        "message": f"浇水提醒已发送，已提醒 {sent_count} 个用户，当前在线用户数: {connection_manager.get_online_count()}"
    }


@router.get("/check")
def check_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    轮询检查端点 - APP 端轮询此接口获取待发送的本地通知

    返回当前用户所有已到期但还未完成的提醒，
    APP 收到后会触发本地通知展示给用户
    """
    now = datetime.utcnow()

    # 查询已到期的提醒（next_due <= now 且未完成）
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.enabled == True,
        Reminder.next_due <= now
    ).all()

    notifications = []

    for reminder in reminders:
        # 获取植物名称
        plant_name = None
        if reminder.plant_id:
            plant = db.query(Plant).filter(Plant.id == reminder.plant_id).first()
            if plant:
                plant_name = plant.name

        # 获取用户植物名称（优先使用昵称，其次使用植物名）
        user_plant_name = None
        if reminder.user_plant_id:
            user_plant = db.query(UserPlant).filter(UserPlant.id == reminder.user_plant_id).first()
            if user_plant:
                user_plant_name = user_plant.nickname or user_plant.plant_name

        # 使用植物名称（优先用户植物名称）
        display_name = user_plant_name or plant_name or "您的植物"

        # 根据提醒类型生成通知内容
        reminder_type_labels = {
            "water": "浇水",
            "fertilize": "施肥",
            "repot": "换盆",
            "prune": "修剪",
            "spray": "喷药",
        }
        action = reminder_type_labels.get(reminder.type, "养护")

        title = "🌱 养护提醒"
        body = f'您的"{display_name}"需要{action}啦！'

        notifications.append({
            "type": "reminder",
            "id": reminder.id,
            "title": title,
            "body": body,
            "reminder_type": reminder.type,
            "plant_name": display_name,
            "timestamp": now.isoformat()
        })

    return {"notifications": notifications}
