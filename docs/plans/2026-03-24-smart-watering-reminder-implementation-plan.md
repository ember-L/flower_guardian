# 智能提醒浇水功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现智能浇水提醒功能，根据植物种类、季节、天气动态调整浇水间隔，并通过定时任务推送通知

**Architecture:** 后端扩展 Reminder 模型和 API，新增天气服务，使用 APScheduler 定时任务；前端对接新 API 并更新 UI

**Tech Stack:** FastAPI, SQLAlchemy, APScheduler, Open-Meteo (天气 API), React Native, Expo Notifications

---

## 实施概览

| 阶段 | 任务数 | 说明 |
|-----|-------|-----|
| 阶段1 | 5 | 数据库模型扩展 |
| 阶段2 | 6 | 后端 API 实现 |
| 阶段3 | 4 | 天气服务实现 |
| 阶段4 | 3 | 定时任务实现 |
| 阶段5 | 4 | 移动端对接 |
| 阶段6 | 2 | 测试与提交 |

---

## 阶段 1: 数据库模型扩展

### Task 1: 扩展 Reminder 模型

**Files:**
- Modify: `backend/app/models/reminder.py:1-22`

**Step 1: 更新 Reminder 模型**

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)  # 新增
    type = Column(String(20))
    interval_days = Column(Integer, default=7)
    base_interval = Column(Integer, nullable=True)  # 新增：基础间隔
    weather_factor = Column(Float, default=1.0)  # 新增：天气系数
    season_factor = Column(Float, default=1.0)  # 新增：季节系数
    calculated_interval = Column(Integer, nullable=True)  # 新增：计算后间隔
    location = Column(String(100), nullable=True)  # 新增：位置
    notify_time = Column(String(5), default="09:00")  # 新增：通知时间
    enabled = Column(Boolean, default=True)
    last_done = Column(DateTime)
    next_due = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reminders")
    user_plant = relationship("UserPlant", back_populates="reminders")
    plant = relationship("Plant")  # 新增
```

**Step 2: 更新 UserPlant 模型添加 relationship**

Modify: `backend/app/models/plant.py` - 检查是否有 UserPlant 模型并添加 reminders relationship

---

### Task 2: 更新 Reminder Schema

**Files:**
- Modify: `backend/app/schemas/reminder.py:1-33`

**Step 1: 更新 Schema**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReminderBase(BaseModel):
    type: str
    interval_days: int = 7
    enabled: bool = True


class ReminderCreate(ReminderBase):
    user_plant_id: int


class ReminderUpdate(BaseModel):
    type: Optional[str] = None
    interval_days: Optional[int] = None
    enabled: Optional[bool] = None
    last_done: Optional[datetime] = None


class SmartReminderCreate(ReminderBase):
    """智能提醒创建"""
    user_plant_id: int
    plant_id: Optional[int] = None
    location: Optional[str] = None
    notify_time: Optional[str] = "09:00"


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    user_plant_id: int
    last_done: Optional[datetime] = None
    next_due: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SmartReminderResponse(ReminderResponse):
    """智能提醒响应"""
    plant_id: Optional[int] = None
    base_interval: Optional[int] = None
    weather_factor: Optional[float] = None
    season_factor: Optional[float] = None
    calculated_interval: Optional[int] = None
    location: Optional[str] = None
    notify_time: Optional[str] = None
    plant_name: Optional[str] = None
    weather_tip: Optional[str] = None
```

---

### Task 3: 创建数据库迁移（可选，如使用 Alembic）

**Files:**
- Modify: `backend/app/db/base.py` - 确保 Base 包含所有模型

**Step 1: 运行 SQL 手动迁移（开发环境）**

```sql
ALTER TABLE reminders
ADD COLUMN plant_id INTEGER REFERENCES plants(id),
ADD COLUMN base_interval INTEGER,
ADD COLUMN weather_factor FLOAT DEFAULT 1.0,
ADD COLUMN season_factor FLOAT DEFAULT 1.0,
ADD COLUMN calculated_interval INTEGER,
ADD COLUMN location VARCHAR(100),
ADD COLUMN notify_time VARCHAR(5) DEFAULT '09:00';
```

---

## 阶段 2: 后端 API 实现

### Task 4: 创建智能提醒计算服务

**Files:**
- Create: `backend/app/services/reminder_service.py`

**Step 1: 创建 reminder_service.py**

```python
from datetime import datetime, timedelta
from typing import Optional
from app.models.plant import Plant


# 水需求到基础间隔天数映射
WATER_REQUIREMENT_INTERVAL = {
    "frequent": 3,
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
}


def get_season_factor() -> float:
    """根据当前月份返回季节系数"""
    month = datetime.utcnow().month
    if month in [6, 7, 8]:  # 夏季
        return 0.7
    elif month in [12, 1, 2]:  # 冬季
        return 1.3
    return 1.0  # 春秋季


def get_weather_factor(
    temperature: Optional[float] = None,
    humidity: Optional[float] = None,
    precipitation: Optional[float] = None
) -> float:
    """根据天气数据计算浇水系数"""
    factor = 1.0

    if temperature is not None:
        if temperature > 30:
            factor *= 0.8  # 高温提前浇水
        elif temperature < 5:
            factor *= 1.2  # 低温延迟浇水

    if humidity is not None:
        if humidity > 80:
            factor *= 1.3  # 高湿延迟
        elif humidity < 30:
            factor *= 0.9  # 干燥提前

    if precipitation is not None and precipitation > 0:
        factor *= 1.3  # 下雨延迟

    return factor


def calculate_smart_interval(
    plant: Optional[Plant],
    weather_factor: float = 1.0,
    season_factor: Optional[float] = None
) -> int:
    """计算智能浇水间隔"""
    if season_factor is None:
        season_factor = get_season_factor()

    if plant and plant.water_requirement:
        base_interval = WATER_REQUIREMENT_INTERVAL.get(
            plant.water_requirement, 7
        )
    else:
        base_interval = 7  # 默认7天

    calculated = int(base_interval * season_factor * weather_factor)
    return max(1, calculated)  # 至少1天


def generate_weather_tip(
    weather_factor: float,
    season_factor: float
) -> Optional[str]:
    """生成天气提示文字"""
    tips = []

    if season_factor < 1.0:
        tips.append("夏季炎热，建议提前浇水")
    elif season_factor > 1.0:
        tips.append("冬季寒冷，可适当延迟浇水")

    if weather_factor < 1.0:
        tips.append("天气炎热，注意补水")
    elif weather_factor > 1.0:
        tips.append("天气湿润，可延迟浇水")

    return "；".join(tips) if tips else None
```

---

### Task 5: 创建天气服务

**Files:**
- Create: `backend/app/services/weather_service.py`

**Step 1: 创建 weather_service.py**

```python
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timedelta


# Open-Meteo API (免费，无需 API Key)
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"


# 中国城市经纬度映射
CITY_COORDINATES = {
    "北京": (39.9042, 116.4074),
    "上海": (31.2304, 121.4737),
    "广州": (23.1291, 113.2644),
    "深圳": (22.5431, 114.0579),
    "杭州": (30.2741, 120.1551),
    "成都": (30.5728, 104.0668),
    "武汉": (30.5928, 114.3055),
    "西安": (34.3416, 108.9398),
    "南京": (32.0603, 118.7969),
    "重庆": (29.4316, 106.9123),
}


async def get_current_weather(location: str) -> Optional[Dict[str, Any]]:
    """获取当前位置天气"""
    coords = CITY_COORDINATES.get(location)
    if not coords:
        return None

    lat, lon = coords

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation",
        "timezone": "Asia/Shanghai"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WEATHER_API_URL, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                return {
                    "temperature": current.get("temperature_2m"),
                    "humidity": current.get("relative_humidity_2m"),
                    "precipitation": current.get("precipitation"),
                    "location": location,
                    "updated_at": datetime.utcnow().isoformat()
                }
        except Exception as e:
            print(f"Weather API error: {e}")

    return None


def get_watering_advice(weather: Dict[str, Any]) -> str:
    """获取浇水建议"""
    temp = weather.get("temperature")
    humidity = weather.get("humidity")
    precipitation = weather.get("precipitation")

    tips = []

    if temp is not None:
        if temp > 35:
            tips.append("高温预警！建议今天浇水")
        elif temp > 30:
            tips.append("天气炎热，可提前浇水")
        elif temp < 5:
            tips.append("低温寒冷，减少浇水")

    if humidity is not None:
        if humidity > 80:
            tips.append("湿度较高，可延迟浇水")
        elif humidity < 30:
            tips.append("空气干燥，建议浇水")

    if precipitation and precipitation > 0:
        tips.append("有降雨，可适当延迟")

    return "；".join(tips) if tips else "天气适宜，按正常间隔浇水"
```

---

### Task 6: 更新 Reminders API

**Files:**
- Modify: `backend/app/api/endpoints/reminders.py:1-82`

**Step 1: 更新 API 端点**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.models.plant import Plant
from app.schemas.reminder import (
    ReminderCreate, ReminderUpdate, ReminderResponse,
    SmartReminderCreate, SmartReminderResponse
)
from app.services.reminder_service import (
    calculate_smart_interval, get_season_factor,
    generate_weather_tip, get_weather_factor
)
from app.services.weather_service import get_current_weather, get_watering_advice

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
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.enabled == True
    ).all()

    result = []
    season_factor = get_season_factor()

    for reminder in reminders:
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
                plant, reminder.weather_factor, season_factor
            )

        # 生成提示
        weather_tip = None
        if reminder.weather_factor != 1.0:
            weather_tip = generate_weather_tip(
                reminder.weather_factor, season_factor
            )

        result.append(SmartReminderResponse(
            **{
                **reminder.__dict__,
                "plant_name": plant_name,
                "weather_tip": weather_tip
            }
        ))

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
            water_map = {"frequent": 3, "weekly": 7, "biweekly": 14, "monthly": 30}
            base_interval = water_map.get(plant.water_requirement, 7)
    else:
        base_interval = reminder.interval_days

    # 计算智能间隔
    calculated_interval = calculate_smart_interval(
        plant, weather_factor, season_factor
    )

    next_due = datetime.utcnow() + timedelta(days=calculated_interval)

    new_reminder = Reminder(
        user_id=current_user.id,
        user_plant_id=reminder.user_plant_id,
        plant_id=reminder.plant_id,
        type=reminder.type,
        interval_days=reminder.interval_days,
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
        **{
            **new_reminder.__dict__,
            "plant_name": plant_name
        }
    )


@router.put("/{reminder_id}/complete", response_model=SmartReminderResponse)
def complete_reminder(
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
        import asyncio
        weather = asyncio.run(get_current_weather(reminder.location))
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
        **{
            **reminder.__dict__,
            "plant_name": plant_name
        }
    )


@router.get("/weather")
async def get_weather_reminder(
    location: str,
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
```

---

## 阶段 3: 定时任务实现

### Task 7: 创建定时任务服务

**Files:**
- Create: `backend/app/tasks/reminder_tasks.py`

**Step 1: 创建任务文件**

```python
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.models.user import User
from app.services.reminder_service import get_season_factor, get_weather_factor
from app.services.weather_service import get_current_weather
import asyncio


async def check_upcoming_reminders():
    """检查即将到期的提醒"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)

        # 查找明天需要提醒的记录
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due <= tomorrow,
            Reminder.next_due >= now
        ).all()

        for reminder in reminders:
            # TODO: 发送推送通知
            print(f"Reminder due: {reminder.id}, type: {reminder.type}")

        return len(reminders)
    finally:
        db.close()


async def refresh_weather_factors():
    """刷新所有活跃提醒的天气系数"""
    db = SessionLocal()
    try:
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.location.isnot(None)
        ).all()

        season_factor = get_season_factor()

        for reminder in reminders:
            if reminder.location:
                weather = await get_current_weather(reminder.location)
                if weather:
                    reminder.weather_factor = get_weather_factor(
                        weather.get("temperature"),
                        weather.get("humidity"),
                        weather.get("precipitation")
                    )

        db.commit()
        return len(reminders)
    finally:
        db.close()


async def send_daily_reminders():
    """每日定时发送提醒"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # 查找当天需要提醒的记录
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due <= now
        ).all()

        # 按用户分组
        user_reminders = {}
        for reminder in reminders:
            if reminder.user_id not in user_reminders:
                user_reminders[reminder.user_id] = []
            user_reminders[reminder.user_id].append(reminder)

        # TODO: 为每个用户发送推送
        for user_id, user_reminders_list in user_reminders.items():
            print(f"Sending {len(user_reminders_list)} reminders to user {user_id}")

        return len(reminders)
    finally:
        db.close()
```

---

### Task 8: 注册定时任务

**Files:**
- Modify: `backend/app/main.py`

**Step 1: 添加 APScheduler 配置**

在 main.py 中添加：

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.reminder_tasks import (
    check_upcoming_reminders,
    refresh_weather_factors,
    send_daily_reminders
)

scheduler = AsyncIOScheduler()


def setup_scheduler():
    """配置定时任务"""
    # 每小时检查即将到期的提醒
    scheduler.add_job(
        check_upcoming_reminders,
        CronTrigger(minute=0),
        id="check_reminders",
        replace_existing=True
    )

    # 每日9点发送提醒
    scheduler.add_job(
        send_daily_reminders,
        CronTrigger(hour=9, minute=0),
        id="daily_reminders",
        replace_existing=True
    )

    # 每6小时刷新天气
    scheduler.add_job(
        refresh_weather_factors,
        CronTrigger(hour="*/6"),
        id="refresh_weather",
        replace_existing=True
    )


@app.on_event("startup")
async def startup_event():
    setup_scheduler()
    scheduler.start()


@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
```

---

## 阶段 4: 移动端对接

### Task 9: 创建 Reminder Service

**Files:**
- Create: `APP/src/services/reminderService.ts`

**Step 1: 创建服务**

```typescript
import { api } from './config';

export interface SmartReminder {
  id: number;
  user_id: number;
  user_plant_id: number;
  plant_id?: number;
  type: string;
  interval_days: number;
  base_interval?: number;
  weather_factor?: number;
  season_factor?: number;
  calculated_interval?: number;
  location?: string;
  notify_time?: string;
  enabled: boolean;
  last_done?: string;
  next_due?: string;
  created_at: string;
  plant_name?: string;
  weather_tip?: string;
}

export interface WeatherInfo {
  temperature: number;
  humidity: number;
  precipitation: number;
  location: string;
  updated_at: string;
}

export const reminderService = {
  getSmartReminders: async (): Promise<SmartReminder[]> => {
    const response = await api.get('/reminders/smart');
    return response.data;
  },

  createSmartReminder: async (data: {
    user_plant_id: number;
    plant_id?: number;
    type: string;
    interval_days?: number;
    location?: string;
    notify_time?: string;
  }): Promise<SmartReminder> => {
    const response = await api.post('/reminders/smart', data);
    return response.data;
  },

  completeReminder: async (id: number): Promise<SmartReminder> => {
    const response = await api.put(`/reminders/${id}/complete`);
    return response.data;
  },

  getWeatherAdvice: async (location: string): Promise<{
    weather: WeatherInfo;
    advice: string;
  }> => {
    const response = await api.get('/reminders/weather', {
      params: { location }
    });
    return response.data;
  },

  toggleReminder: async (id: number, enabled: boolean): Promise<SmartReminder> => {
    const response = await api.put(`/reminders/${id}`, { enabled });
    return response.data;
  },

  deleteReminder: async (id: number): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  }
};
```

---

### Task 10: 更新 ReminderScreen

**Files:**
- Modify: `APP/src/screens/ReminderScreen.tsx:1-303`

**Step 1: 更新组件逻辑**

```typescript
// 智能提醒管理页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { reminderService, SmartReminder } from '../services/reminderService';

interface ReminderScreenProps extends Partial<NavigationProps> {}

const reminderTypeIcons: Record<string, any> = {
  water: Icons.Droplets,
  fertilize: Icons.Flower2,
  prune: Icons.Scissors
};
const reminderTypeColors: Record<string, string> = {
  water: '#0891B2',
  fertilize: '#059669',
  prune: '#F59E0B'
};

export function ReminderScreen({ onGoBack }: ReminderScreenProps) {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await reminderService.getSmartReminders();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id.toString() === id);
    if (!reminder) return;

    try {
      await reminderService.toggleReminder(id, !reminder.enabled);
      setReminders(prev =>
        prev.map(r => r.id.toString() === id ? { ...r, enabled: !r.enabled } : r)
      );
    } catch (error) {
      Alert.alert('错误', '更新提醒失败');
    }
  };

  const handleComplete = async (id: number, title: string) => {
    Alert.alert(
      '确认完成',
      `确定已完成 ${title} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              const updated = await reminderService.completeReminder(id);
              setReminders(prev =>
                prev.map(r => r.id === id ? updated : r)
              );
              Alert.alert('成功', '已记录完成，下次提醒已更新');
            } catch (error) {
              Alert.alert('错误', '操作失败');
            }
          }
        }
      ]
    );
  };

  const handleSnooze = (id: string) => {
    Alert.alert('延迟提醒', '选择延迟时间', [
      { text: '1天后', onPress: () => {} },
      { text: '3天后', onPress: () => {} },
      { text: '取消', style: 'cancel' }
    ]);
  };

  const formatNextDue = (nextDue?: string) => {
    if (!nextDue) return '未知';
    const date = new Date(nextDue);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return '已到期';
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    return `${diff}天后`;
  };

  const handleGoBack = () => {
    if (onGoBack) onGoBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Icons.Bell size={32} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>智能提醒</Text>
            <Text style={styles.headerSubtitle}>根据天气智能调整浇水间隔</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 统计卡片 */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.filter(r => r.enabled).length}</Text>
              <Text style={styles.statLabel}>活跃提醒</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.length}</Text>
              <Text style={styles.statLabel}>总提醒数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>
                {reminders.filter(r => {
                  if (!r.next_due) return false;
                  const diff = Math.ceil((new Date(r.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return diff <= 0;
                }).length}
              </Text>
              <Text style={styles.statLabel}>今日待办</Text>
            </View>
          </View>

          {/* 提醒列表标题 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>提醒列表</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{reminders.filter(r => r.enabled).length} 个</Text>
            </View>
          </View>

          {/* 提醒卡片 */}
          {reminders.map((reminder) => {
            const Icon = reminderTypeIcons[reminder.type] || Icons.Bell;
            const typeColor = reminderTypeColors[reminder.type] || colors.primary;
            const intervalText = reminder.calculated_interval
              ? `每 ${reminder.calculated_interval} 天（智能）`
              : `每 ${reminder.interval_days} 天`;

            return (
              <View key={reminder.id.toString()} style={[styles.reminderCard, !reminder.enabled && styles.reminderDisabled]}>
                <View style={styles.reminderRow}>
                  <View style={[styles.reminderIcon, { backgroundColor: typeColor + '15' }]}>
                    <Icon size={26} color={typeColor} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>
                      {reminder.plant_name || '植物'} - {reminder.type === 'water' ? '浇水' : reminder.type === 'fertilize' ? '施肥' : '修剪'}
                    </Text>
                    <View style={styles.reminderMeta}>
                      <Text style={styles.reminderInterval}>{intervalText}</Text>
                      {reminder.weather_tip && reminder.enabled && (
                        <View style={[styles.weatherTipBadge, { backgroundColor: colors.warning + '15' }]}>
                          <Icons.Cloud size={12} color={colors.warning} />
                          <Text style={styles.weatherTipText}>{reminder.weather_tip}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.nextDateBadge, { backgroundColor: reminder.enabled ? typeColor + '15' : colors.border }]}>
                      <Icons.Clock size={12} color={reminder.enabled ? typeColor : colors['text-tertiary']} />
                      <Text style={[styles.nextDateText, { color: reminder.enabled ? typeColor : colors['text-tertiary'] }]}>
                        {formatNextDue(reminder.next_due)}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id.toString())}
                    trackColor={{ false: colors.border, true: typeColor + '50' }}
                    thumbColor={reminder.enabled ? typeColor : colors['text-tertiary']}
                  />
                </View>
                {reminder.enabled && (
                  <View style={styles.reminderActions}>
                    <TouchableOpacity onPress={() => handleSnooze(reminder.id.toString())} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Clock size={16} color={colors['text-secondary']} />
                      <Text style={styles.actionButtonText}>延迟</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleComplete(reminder.id, reminder.type === 'water' ? '浇水' : '养护')}
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      activeOpacity={0.7}
                    >
                      <Icons.Check size={16} color="#fff" />
                      <Text style={[styles.actionButtonText, { color: '#fff' }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* 养护小贴士 */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIcon}>
                <Icons.Lightbulb size={20} color={colors.warning} />
              </View>
              <Text style={styles.tipTitle}>智能提醒说明</Text>
            </View>
            <Text style={styles.tipText}>
              智能提醒会根据植物种类、季节和天气自动调整浇水间隔。高温天气会提前提醒，阴雨天气会适当延迟。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // ... (保留原有样式)
});
```

---

## 阶段 5: 测试与提交

### Task 11: 测试后端 API

**Step 1: 启动后端服务**

```bash
cd backend
uvicorn app.main:app --reload
```

**Step 2: 测试端点**

```bash
# 获取智能提醒
curl -X GET "http://localhost:8000/api/reminders/smart" \
  -H "Authorization: Bearer <token>"

# 获取天气建议
curl -X GET "http://localhost:8000/api/reminders/weather?location=北京" \
  -H "Authorization: Bearer <token>"
```

---

### Task 12: 提交代码

```bash
git add backend/app/models/reminder.py backend/app/schemas/reminder.py
git add backend/app/services/reminder_service.py backend/app/services/weather_service.py
git add backend/app/api/endpoints/reminders.py
git add backend/app/tasks/reminder_tasks.py
git add backend/app/main.py
git add APP/src/services/reminderService.ts
git add APP/src/screens/ReminderScreen.tsx
git commit -m "feat: 添加智能浇水提醒功能

- 根据植物种类、季节、天气动态调整浇水间隔
- 接入 Open-Meteo 天气 API
- 新增定时任务自动推送提醒
- 移动端展示智能间隔和天气提示"
```

---

## 实施完成

**Plan complete and saved to `docs/plans/2026-03-24-smart-watering-reminder-implementation-plan.md`**

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
