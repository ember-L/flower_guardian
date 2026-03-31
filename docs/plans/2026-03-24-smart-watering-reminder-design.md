# 智能提醒浇水功能设计方案

## 1. 核心架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   植物数据库    │────▶│  智能计算引擎    │────▶│  定时任务服务   │
│ (water_need)    │     │  (天气+植物+季)  │     │  (Celery/APScheduler) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┘
                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   天气 API      │────▶│  提醒计算模型    │────▶│  推送服务       │
│ (温度/湿度/降雨)│     │  (动态间隔)      │     │  (Expo Push)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 2. 智能计算逻辑

### 2.1 基础间隔映射

从 `plants` 表的 `water_requirement` 字段获取基础间隔：

| water_requirement | 基础间隔 |
|-------------------|---------|
| frequent | 3天 |
| weekly | 7天 |
| biweekly | 14天 |
| monthly | 30天 |

### 2.2 动态调整系数

**季节系数**：
- 夏季（6-8月）：×0.7（缩短间隔）
- 冬季（12-2月）：×1.3（延长间隔）
- 春秋季：×1.0

**天气系数**（根据实时天气 API 调整）：
- 高温（>30°C）：×0.8（提前浇水）
- 低温（<5°C）：×1.2（延迟浇水）
- 雨天/高湿度（>80%）：×1.3
- 干燥（<30%）：×0.9

**最终计算公式**：
```
calculated_interval = base_interval × season_factor × weather_factor
```

## 3. 数据模型扩展

### 3.1 Reminder 表新增字段

```python
# backend/app/models/reminder.py 新增
plant_id: int = Column(Integer, ForeignKey("plants.id"), nullable=True)  # 关联植物基础数据
base_interval: int = Column(Integer, nullable=True)  # 基础间隔（天）
weather_factor: float = Column(Float, default=1.0)  # 天气系数
season_factor: float = Column(Float, default=1.0)  # 季节系数
calculated_interval: int = Column(Integer, nullable=True)  # 计算后的实际间隔
location: str = Column(String(100), nullable=True)  # 用户位置（城市名）
notify_time: str = Column(String(5), default="09:00")  # 偏好通知时间
```

### 3.2 Schema 更新

```python
# backend/app/schemas/reminder.py 新增
class SmartReminderCreate(ReminderBase):
    plant_id: Optional[int] = None
    location: Optional[str] = None
    notify_time: Optional[str] = "09:00"

class SmartReminderResponse(ReminderResponse):
    plant_name: Optional[str] = None
    base_interval: Optional[int] = None
    weather_factor: Optional[float] = None
    season_factor: Optional[float] = None
    calculated_interval: Optional[int] = None
    weather_tip: Optional[str] = None  # 天气调整提示
```

## 4. 后端 API 端点

### 4.1 提醒管理

| 方法 | 端点 | 功能 |
|-----|-----|-----|
| GET | `/api/reminders/smart` | 获取智能计算后的提醒列表（包含植物名称、天气提示） |
| POST | `/api/reminders/smart` | 创建智能提醒，自动计算间隔 |
| PUT | `/api/reminders/{id}/complete` | 标记完成，重新计算下次提醒时间 |
| PUT | `/api/reminders/{id}/adjust` | 手动调整间隔（用户覆盖智能计算） |
| GET | `/api/reminders/weather` | 获取当前位置当前天气及浇水建议 |

### 4.2 天气服务

```python
# 新增天气服务
class WeatherService:
    - get_current_weather(location: str) -> WeatherData
    - calculate_watering_factor(weather: WeatherData) -> float
```

使用免费天气 API（如 Open-Meteo，无需 API Key）。

## 5. 定时任务

### 5.1 任务配置（APScheduler）

```python
# backend/app/tasks/reminder_tasks.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

# 每小时检查次日提醒
@scheduler.scheduled_job('cron', hour='*', minute=0)
async def check_upcoming_reminders():
    """检查即将到期的提醒，推送通知"""

# 每日定时推送
@scheduler.scheduled_job('cron', hour=9, minute=0)
async def send_daily_reminders():
    """每日9点发送浇水提醒"""

# 每6小时更新天气缓存
@scheduler.scheduled_job('cron', hour='*/6')
async def refresh_weather_cache():
    """刷新天气缓存"""
```

## 6. 移动端功能

### 6.1 提醒列表页

- 显示智能计算的间隔："每7天（智能）"
- 天气影响提示标签："因高温建议提前"
- 显示下次浇水倒计时

### 6.2 提醒操作

- **一键完成**：点击后记录完成时间，自动计算下次提醒
- **延迟提醒**：1天/3天/自定义延迟
- **手动调整**：用户可覆盖智能间隔

### 6.3 API 调用示例

```typescript
// APP/src/services/reminderService.ts
export const reminderService = {
  getSmartReminders: () => api.get('/reminders/smart'),
  completeReminder: (id: number) => api.put(`/reminders/${id}/complete`),
  getWeatherTip: (location: string) => api.get('/reminders/weather', { params: { location } }),
}
```

## 7. 实施步骤

1. 数据库迁移：添加新字段
2. 后端 API：实现智能计算逻辑
3. 天气服务：接入免费天气 API
4. 定时任务：实现推送检查逻辑
5. 移动端：对接新 API，更新 UI
6. 测试：各环节单元测试

## 8. 注意事项

- 天气 API 使用 Open-Meteo（免费无需 Key）
- 定时任务使用 APScheduler（已在项目中使用）
- 推送服务使用 Expo Notifications（已在项目中使用）
- 默认位置可从用户资料获取或让用户手动设置
