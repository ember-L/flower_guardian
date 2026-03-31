# 推送通知功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为护花使者 App 实现服务器推送（极光）和本地通知功能，当植物需要浇水时通过系统通知提醒用户

**Architecture:** 后端使用 APScheduler 定时检查到期提醒，调用极光推送 API 发送通知；App 集成极光推送 SDK 接收通知

**Tech Stack:** FastAPI, APScheduler, 极光推送 (jpush), React Native (Expo), jpush-react-native

---

### Task 1: 后端集成极光推送 SDK

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/app/services/push_service.py`

**Step 1: 添加极光推送依赖**

```bash
cd backend
pip install jpush
```

Run: `pip install jpush`
Expected: jpush 包安装成功

**Step 2: 创建推送服务**

创建文件 `backend/app/services/push_service.py`:

```python
import os
import logging
from typing import Optional
from jpush import JPush

logger = logging.getLogger(__name__)

# 极光推送配置
JPUSH_APP_KEY = os.getenv("JPUSH_APP_KEY", "")
JPUSH_MASTER_SECRET = os.getenv("JPUSH_MASTER_SECRET", "")

class PushService:
    def __init__(self):
        self.client = None
        if JPUSH_APP_KEY and JPUSH_MASTER_SECRET:
            self.client = JPush(JPUSH_APP_KEY, JPUSH_MASTER_SECRET)

    def send_notification(
        self,
        alias: str,
        title: str,
        content: str,
        extras: Optional[dict] = None
    ) -> bool:
        """向指定用户发送推送通知"""
        if not self.client:
            logger.warning("极光推送未配置，跳过发送")
            return False

        try:
            push = self.client.create_push()
            push.audience = {"alias": [alias]}
            push.notification = {
                "android": {
                    "alert": content,
                    "title": title,
                    "extras": extras or {}
                },
                "ios": {
                    "alert": content,
                    "sound": "default",
                    "extras": extras or {}
                }
            }
            push.send()
            logger.info(f"推送成功: {alias} - {title}")
            return True
        except Exception as e:
            logger.error(f"推送失败: {e}")
            return False

push_service = PushService()
```

Run: `cat backend/app/services/push_service.py`
Expected: 文件内容确认

**Step 3: 更新 requirements.txt**

在 `backend/requirements.txt` 添加:
```
jpush>=3.6.0
```

Run: `grep jpush backend/requirements.txt`
Expected: 找到 jpush

**Step 4: Commit**

```bash
cd backend
git add requirements.txt app/services/push_service.py
git commit -m "feat: 添加极光推送服务"
```

---

### Task 2: 后端定时推送任务

**Files:**
- Modify: `backend/app/tasks/reminder_tasks.py`

**Step 1: 添加推送任务函数**

在 `backend/app/tasks/reminder_tasks.py` 末尾添加:

```python
from app.services.push_service import push_service

def send_push_notifications():
    """发送到期提醒的推送通知"""
    from app.core.database import SessionLocal
    from app.models.reminder import Reminder
    from datetime import datetime

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # 查找今天到期的提醒
        due_reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due <= now
        ).all()

        for reminder in due_reminders:
            # 获取用户信息
            user = db.query(User).filter(User.id == reminder.user_id).first()
            if not user or not user.username:
                continue

            # 根据类型生成不同消息
            type_names = {"water": "浇水", "fertilize": "施肥", "prune": "修剪"}
            reminder_type = type_names.get(reminder.type, "养护")
            plant_name = reminder.plant_name or "植物"

            title = "🌱 浇水提醒"
            content = f'您的"{plant_name}"今天需要{reminder_type}啦！'

            # 发送推送
            push_service.send_notification(
                alias=str(user.id),
                title=title,
                content=content,
                extras={"type": "reminder", "reminder_id": reminder.id}
            )

        logger.info(f"发送了 {len(due_reminders)} 条推送通知")
    finally:
        db.close()
```

Run: `grep send_push_notifications backend/app/tasks/reminder_tasks.py`
Expected: 找到函数定义

**Step 2: 在 main.py 注册任务**

修改 `backend/app/main.py`:

```python
scheduler.add_job(
    send_push_notifications,
    CronTrigger(hour="*/6"),  # 每6小时执行
    id="push_notifications",
    replace_existing=True
)
```

Run: `grep send_push_notifications backend/app/main.py`
Expected: 找到任务注册

**Step 3: Commit**

```bash
git add app/tasks/reminder_tasks.py app/main.py
git commit -m "feat: 添加定时推送任务"
```

---

### Task 3: App 集成极光推送

**Files:**
- Modify: `APP/package.json`
- Modify: `APP/app.json`
- Create: `APP/src/services/pushService.ts`

**Step 1: 安装依赖**

```bash
cd APP
npm install jpush-react-native
```

Run: `npm list jpush-react-native`
Expected: 包已安装

**Step 2: 配置 app.json**

在 `APP/app.json` 的 `expo` 下添加:

```json
"plugins": [
  [
    "jpush-react-native",
    {
      "appKey": "your-jpush-app-key",
      "channel": "default"
    }
  ]
]
```

Run: `grep jpush APP/app.json`
Expected: 找到 jpush 配置

**Step 3: 创建推送服务**

创建 `APP/src/services/pushService.ts`:

```typescript
import JPush from 'jpush-react-native';

export const pushService = {
  init: () => {
    JPush.init();
    JPush.setDebugMode(true);
  },

  addEventListener: (callback: (event: any) => void) => {
    JPush.addReceiveNotificationListener(callback);
  },

  removeEventListener: (callback: (event: any) => void) => {
    JPush.removeReceiveNotificationListener(callback);
  },

  addOpenNotificationListener: (callback: (event: any) => void) => {
    JPush.addReceiveOpenNotificationListener(callback);
  },

  getRegistrationID: (callback: (id: string) => void) => {
    JPush.getRegistrationID((id: string) => callback(id));
  },
};
```

Run: `ls APP/src/services/pushService.ts`
Expected: 文件存在

**Step 4: 在 App 入口初始化**

在 `APP/App.tsx` 或入口文件添加:

```typescript
import { pushService } from './src/services/pushService';

// 初始化推送
pushService.init();

// 监听通知
pushService.addEventListener((event) => {
  console.log('收到通知:', event);
});

// 监听点击通知
pushService.addOpenNotificationListener((event) => {
  console.log('点击通知:', event);
  // 可以根据 extra 跳转页面
});
```

Run: `grep pushService APP/App.tsx`
Expected: 找到初始化代码

**Step 5: Commit**

```bash
cd APP
git add package.json app.json src/services/pushService.ts
git commit -m "feat: 集成极光推送"
```

---

### Task 4: App 处理通知跳转

**Files:**
- Modify: `APP/App.tsx` 或主入口
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 传递通知事件到导航**

在 `APP/src/navigation/AppNavigator.tsx` 添加处理逻辑:

```typescript
// 在 AppNavigator 中添加
const [notificationParams, setNotificationParams] = useState<any>(null);

// 处理推送通知跳转
useEffect(() => {
  const handleOpenNotification = (event: any) => {
    const { type, reminder_id } = event.extras || {};
    if (type === 'reminder' && reminder_id) {
      // 跳转到提醒页面
      setCurrentSubPage('Reminder');
    }
  };

  pushService.addOpenNotificationListener(handleOpenNotification);
  return () => {
    pushService.removeOpenNotificationListener(handleOpenNotification);
  };
}, []);
```

Run: `grep notificationParams APP/src/navigation/AppNavigator.tsx`
Expected: 找到相关代码

**Step 2: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: 处理推送通知跳转"
```

---

### Task 5: 环境配置与测试

**Step 1: 配置极光推送凭据**

在 `backend/.env` 添加:
```
JPUSH_APP_KEY=your-app-key
JPUSH_MASTER_SECRET=your-master-secret
```

在 `APP/app.json` 填写实际的 App Key

**Step 2: 测试后端推送**

```bash
cd backend
uvicorn app.main:app --reload
```

在浏览器访问: `http://localhost:8000/api/reminders/smart`
Expected: 返回提醒列表

**Step 3: 测试 App 接收**

1. 在手机上安装 App
2. 创建浇水提醒
3. 等待定时任务触发推送（或手动调用推送函数）

**Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: 添加环境变量配置示例"
```

---

## 执行选项

**"Plan complete and saved to `docs/plans/2026-03-27-push-notification-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans