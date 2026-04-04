# 实时通信功能设计

> **功能**: WebSocket（AI 流式输出）+ SSE（养护提醒通知）
>
> **目标**: 后端主动推送通知到 App，触发本地通知

## 1. 架构概览

```
┌─────────────┐         ┌──────────────────┐
│   APP 端     │         │    后端 FastAPI   │
│             │         │                  │
│ ┌─────────┐ │  WebSocket │ ┌──────────────┐ │
│ │AI问诊   │◄───────────►│ │WebSocket处理 │ │
│ │流式输出 │ │  连接      │ │              │ │
│ └─────────┘ │           │ │ /ws/ai/chat  │ │
│ ┌─────────┐ │  SSE 连接   │ └──────────────┘ │
│ │提醒通知 │ │◄───────────│ ┌──────────────┐ │
│ │触发本地 │ │           │ │ SSE处理器    │ │
│ │通知     │ │           │ │ /ws/notifications/sse │
│ └─────────┘ │           │ └──────────────┘ │
└─────────────┘           └──────────────────┘
```

## 2. 技术选型

| 功能 | 技术 | 端点 | 说明 |
|------|------|------|------|
| AI 流式输出 | WebSocket | `/ws/ai/chat` | 双向通信，AI 回复流式推送 |
| 养护提醒通知 | SSE | `/ws/notifications/sse` | 单向推送，App 收到后触发本地通知 |

## 3. API 设计

### 3.1 WebSocket - AI 问诊流式输出

**端点**: `ws://host/ws/ai/chat`

**连接参数**:
```
ws://localhost:8000/ws/ai/chat?token=<JWT>
```

**客户端 → 服务端 消息格式**:
```json
{
  "type": "message",
  "content": "用户的问题...",
  "conversation_id": 123,  // 可选，继续对话
  "system_context": "植物诊断"  // 可选，上下文
}
```

**服务端 → 客户端 消息格式**:
```json
// 流式输出
{
  "type": "chunk",
  "content": "AI正在思考..."
}

// 完成
{
  "type": "done",
  "content": "完整的AI回复",
  "conversation_id": 123
}

// 错误
{
  "type": "error",
  "error": "错误信息"
}
```

### 3.2 SSE - 养护提醒通知

**端点**: `http://host/ws/notifications/sse?token=<JWT>`

**认证**: JWT Token 通过 query 参数传递

**服务端推送消息格式**:
```json
{
  "type": "reminder",
  "id": 1,
  "title": "🌱 养护提醒",
  "body": "您的\"绿萝\"需要浇水啦！",
  "reminder_type": "water",
  "plant_name": "绿萝",
  "timestamp": "2026-04-03T10:00:00Z"
}
```

**客户端收到后触发本地通知**:
```typescript
// App 端收到 SSE 消息后
const eventSource = new EventSource(`/ws/notifications/sse?token=${token}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'reminder') {
    // 触发本地通知
    reminderNotificationService.triggerNotification(
      data.title,
      data.body,
      { type: 'reminder', reminder_id: data.id }
    );
  }
};
```

## 4. 数据流设计

### 4.1 AI 问诊流程

```
1. App 建立 WebSocket 连接
   ws = new WebSocket('ws://host/ws/ai/chat?token=JWT')

2. App 发送消息
   ws.send(JSON.stringify({
     type: 'message',
     content: '我的绿萝叶子发黄怎么办？'
   }))

3. 后端接收消息，调用 AI 服务
   - 启用流式输出 (stream=True)
   - 逐字发送给客户端

4. App 接收流式数据，实时显示
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'chunk') {
       appendText(data.content); // 逐字追加显示
     }
   }

5. 完成
   ws.close();
```

### 4.2 养护提醒流程

```
1. 后端定时任务检查提醒
   - APScheduler 定时任务
   - 每分钟检查即将到期的提醒

2. 发现到期提醒，查询 SSE 连接用户
   - 维护活跃 SSE 连接列表
   - 找到对应用户的连接

3. 通过 SSE 推送消息
   - await sse.send(data)

4. App 接收 SSE，触发本地通知
   - notificationService.triggerNotification()
   - 系统通知栏显示通知

5. 用户点击通知，进入对应页面
```

## 5. 连接管理

### 5.1 后端连接存储

```python
# 内存存储（生产环境建议用 Redis）
class ConnectionManager:
    def __init__(self):
        # WebSocket 连接: user_id -> websocket
        self.ws_connections: Dict[int, WebSocket] = {}

        # SSE 连接: user_id -> SSE response
        self.sse_connections: Dict[int, AsyncGenerator] = {}

    async def connect_ws(self, user_id: int, websocket: WebSocket):
        self.ws_connections[user_id] = websocket

    async def disconnect_ws(self, user_id: int):
        self.ws_connections.pop(user_id, None)

    async def connect_sse(self, user_id: int, sse_generator):
        self.sse_connections[user_id] = sse_generator

    async def disconnect_sse(self, user_id: int):
        self.sse_connections.pop(user_id, None)

    # 推送通知到指定用户
    async def push_notification(self, user_id: int, data: dict):
        if user_id in self.sse_connections:
            await self.sse_connections[user_id].send(data)
```

### 5.2 心跳机制

```python
# WebSocket 心跳
@router.websocket("/ws/ai/chat")
async def websocket_endpoint(websocket: WebSocket):
    # 每 30 秒发送心跳
    async def heartbeat():
        while True:
            await websocket.send_json({"type": "ping"})
            await asyncio.sleep(30)

    # 客户端需要在 30 秒内响应 pong
```

## 6. 认证流程

### 6.1 JWT 验证

```python
from fastapi import WebSocket, Query
from jose import JWTError, jwt

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

@router.websocket("/ws/ai/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # 验证 Token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    # 连接成功
    await websocket.accept()
    # ...
```

## 7. 错误处理

| 错误 | 处理方式 |
|------|---------|
| Token 无效 | WebSocket 关闭 (code 4001) |
| AI 服务错误 | 发送错误消息给客户端 |
| 连接断开 | 清理连接记录 |
| 后端重启 | 客户端自动重连 |

## 8. 实现文件

### 后端

| 文件 | 功能 |
|------|------|
| `app/api/endpoints/websocket.py` | WebSocket 和 SSE 端点 |
| `app/services/connection_manager.py` | 连接管理服务 |
| `app/core/websocket_deps.py` | 认证依赖 |
| `app/tasks/notification_tasks.py` | SSE 推送任务 |

### APP

| 文件 | 功能 |
|------|------|
| `src/services/websocketService.ts` | WebSocket 服务 |
| `src/services/sseService.ts` | SSE 服务 |
| `src/screens/ConsultationScreen.tsx` | AI 问诊页面（改造） |

## 9. 测试计划

### 后端测试
```bash
# 测试 WebSocket
wscat -c ws://localhost:8000/ws/ai/chat?token=<JWT>

# 测试 SSE
curl -N -H "Authorization: Bearer <JWT>" http://localhost:8000/ws/notifications/sse
```

### APP 测试
1. 连接 WebSocket，发送消息，验证流式输出
2. 后端推送 SSE，验证本地通知触发
3. 断网重连测试
4. 后台切前台重连测试

---

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| AI 用 WebSocket | ✅ | 需要双向通信，实时流式输出 |
| 提醒用 SSE | ✅ | 单向推送，SSE 更简单 |
| Token 通过 Query | ✅ | WebSocket 不支持 Header |
| 内存存储连接 | ⚠️ | MVP 阶段，后续迁移到 Redis |
| 心跳间隔 | 30 秒 | 平衡性能和资源 |

---

*文档最后更新：2026-04-03*
