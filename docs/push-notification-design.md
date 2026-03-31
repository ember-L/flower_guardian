# 推送通知功能设计文档

## 概述

护花使者支持多种推送方式，确保用户能及时收到植物养护提醒。

## 推送方式

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| **Expo Push** | 直接向设备发送推送 | 主要方式，需要用户打开 App 并获取 Token |
| **JPush (极光)** | 通过极光服务推送 | 备选方式，支持别名推送 |
| **FCM** | Firebase Cloud Messaging | Android 设备推送 |
| **APNs** | Apple Push Notification Service | iOS 设备推送 |

## 推送流程

```
┌──────────────────┐     1. 登录获取 Token      ┌──────────────────┐
│                  │ ─────────────────────────► │                  │
│   移动端 App      │ ◄───────────────────────── │   后端 API       │
│  (Expo + JPush)  │      2. 保存 Token          │                  │
│                  │                             │                  │
└──────────────────┘                             └────────┬─────────┘
                                                          │
                                                          │ 3. 定时检查
                                                          ▼
┌──────────────────┐     5. 收到推送      ┌──────────────────┐
│                  │ ◄─────────────────── │                  │
│   用户手机        │                      │   定时任务       │
│                  │ ────────────────────► │                  │
└──────────────────┘     4. 发送推送       └──────────────────┘
```

## 推送时间

| 任务 | 执行时间 | 功能 |
|------|----------|------|
| `check_upcoming_reminders` | 每小时 :00 | 检查即将到期的提醒（日志记录） |
| `send_daily_reminders` | 每日 09:00 | 发送当天到期提醒 |
| `send_overdue_reminders` | 每3小时 | 发送已逾期提醒 |
| `refresh_weather_factors` | 每6小时 | 更新天气影响系数 |

## 消息类型

### 1. 每日提醒 (daily_reminder)
- **发送时间**: 每日 09:00
- **触发条件**: `next_due <= now + 2小时`
- **消息示例**:
  ```
  标题: 🌱 养护提醒
  内容: 您的植物："绿萝"需要浇水，"吊兰"需要施肥，快去看看吧！
  ```

### 2. 逾期提醒 (overdue_reminder)
- **发送时间**: 每3小时 (00:00, 03:00, 06:00...)
- **触发条件**: `next_due < now - 1小时`
- **消息示例**:
  ```
  标题: ⚠️ 提醒逾期
  内容: 以下植物还未养护："绿萝"需要浇水，不要忘记哦！
  ```

### 3. 测试推送 (test)
- **用途**: 测试推送功能是否正常

## 推送服务实现

### 文件结构

```
backend/app/
├── services/
│   └── push_service.py      # 推送服务核心
├── tasks/
│   └── reminder_tasks.py    # 定时任务
└── main.py                  # 定时任务调度配置
```

### PushService 类

```python
class PushService:
    # 发送推送
    send_to_user(user, title, content, data)

    # 批量发送
    send_batch(users, title, content, data)

    # JPush 发送（别名方式）
    send_notification(alias, title, content, extras)
```

### 优先级策略

1. **Expo Push Token** (`ExponentPushToken[xxx]`)
2. **FCM Token** (`fcm:xxx` - Android)
3. **APNs Token** (`apns:xxx` - iOS)
4. **JPush Alias** (用户ID)

## 环境配置

### 后端 (.env)

```env
# 极光推送配置 (JPush)
JPUSH_APP_KEY=your_jpush_app_key
JPUSH_MASTER_SECRET=your_jpush_master_secret

# FCM 配置 (可选，Android 推送)
FCM_SERVER_KEY=your_fcm_server_key
```

### 前端配置 (app.json)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#f46"
        }
      ]
    ]
  }
}
```

## API 接口

### 1. 注册推送 Token

```
POST /api/users/push-token
Authorization: Bearer {token}

Body:
{
  "expo_push_token": "ExponentPushToken[xxxxxx]"
}
```

### 2. 测试推送 (开发用)

```python
# 后端手动调用
from app.tasks.reminder_tasks import test_push
await test_push(user_id=1)
```

## 定时任务管理

### 查看运行中的任务

后端启动时会输出：
```
定时任务调度器已启动
```

### 手动触发任务

在 Python shell 中：

```python
from app.tasks.reminder_tasks import send_daily_reminders, test_push
import asyncio

# 发送每日提醒
asyncio.run(send_daily_reminders())

# 测试推送
asyncio.run(test_push(user_id=1))
```

## 数据库字段

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `expo_push_token` | VARCHAR(500) | Expo 推送 Token |

## 注意事项

1. **Token 获取**: 用户首次打开 App 时获取推送权限并获取 Token
2. **Token 更新**: 用户重新登录或 Token 失效时需要重新获取
3. **网络要求**: 推送需要后端服务器能够访问外网
4. **时区**: 所有时间使用 UTC，建议在消息中显示本地时间

## 常见问题

### Q: 推送收不到？
1. 检查用户是否已登录并获取 Token
2. 检查后端日志是否有错误
3. 确认设备网络正常
4. 检查 App 通知权限是否开启

### Q: 如何测试推送？
1. 登录 App，确保 Token 已保存到后端
2. 在后端执行 `test_push(user_id)`
3. 检查 App 是否收到通知

### Q: 如何修改推送时间？
编辑 `backend/app/main.py` 中的 `setup_scheduler()` 函数。
