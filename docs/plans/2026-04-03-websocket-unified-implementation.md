# WebSocket 统一实时通信通道 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立统一的 WebSocket 实时通信通道，替代轮询 + SSE 混合方案，实现即时推送、自动重连、心跳保活

**Architecture:** 后端使用 FastAPI WebSocket，新增 `/ws/push` 推送通道，保留 `/ws/chat` AI对话；APP 端重写 WebSocket 客户端，实现自动重连、心跳、离线队列、消息分发

**Tech Stack:** FastAPI (后端) + React Native WebSocket API (APP) + asyncio (连接管理)

---

## 任务清单

### Task 1: 增强后端 ConnectionManager

**Files:**
- Modify: `backend/app/services/connection_manager.py`

**Step 1: 添加连接状态跟踪**

```python
# 在 ConnectionManager 类中添加

# 连接状态跟踪
self.connection_status: Dict[int, Dict[str, Any]] = {}

# 序列号生成器
self._sequence: Dict[int, int] = defaultdict(int)

def get_next_seq(self, user_id: int) -> int:
    """获取下一个序列号"""
    self._sequence[user_id] += 1
    return self._sequence[user_id]

def set_connection_status(self, user_id: int, status: str):
    """设置连接状态"""
    self.connection_status[user_id] = {
        "status": status,
        "last_update": datetime.utcnow()
    }

def get_connection_status(self, user_id: int) -> Optional[Dict]:
    """获取连接状态"""
    return self.connection_status.get(user_id)
```

**Step 2: 添加心跳超时检测**

```python
# 添加 last_heartbeat 跟踪
self.last_heartbeat: Dict[int, datetime] = {}

def update_heartbeat(self, user_id: int):
    """更新心跳时间"""
    self.last_heartbeat[user_id] = datetime.utcnow()

def is_heartbeat_timeout(self, user_id: int, timeout_seconds: int = 60) -> bool:
    """检查心跳是否超时"""
    if user_id not in self.last_heartbeat:
        return False
    elapsed = (datetime.utcnow() - self.last_heartbeat[user_id]).total_seconds()
    return elapsed > timeout_seconds
```

**Step 3: 提交代码**

```bash
cd /Users/ember/Flower_Guardian
git add backend/app/services/connection_manager.py
git commit -m "feat: 增强 ConnectionManager 连接状态跟踪和心跳管理"
```

---

### Task 2: 新增后端 `/ws/push` 推送端点

**Files:**
- Modify: `backend/app/api/endpoints/websocket.py`

**Step 1: 添加新的推送 WebSocket 端点**

在 `websocket.py` 文件末尾添加:

```python
# ==================== WebSocket 端点 - 推送通道 ====================

@router.websocket("/push")
async def websocket_push(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket 推送端点 - 接收后端推送的养护提醒、系统通知

    连接方式:
    ws://host/ws/push?token=JWT

    服务端推送消息格式:
    {
        "type": "push",
        "action": "reminder",
        "data": {...},
        "timestamp": "...",
        "seq": 123
    }

    客户端心跳:
    {"type": "heartbeat", "action": "ping"}

    客户端 ACK:
    {"type": "ack", "seq": 123}
    """
    from datetime import datetime

    # 验证 Token
    token_data = verify_token(token)
    if not token_data or not token_data.get("user_id"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = token_data["user_id"]

    # 接受连接
    await websocket.accept()
    await connection_manager.connect_ws(user_id, websocket)
    connection_manager.set_connection_status(user_id, "connected")
    connection_manager.update_heartbeat(user_id)

    logger.info(f"[WS/Push] 用户 {user_id} ({token_data.get('username')}) 推送通道已建立")

    try:
        # 发送连接成功消息
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

        while True:
            # 接收客户端消息
            data = await websocket.receive_json()

            # 心跳
            if data.get("type") == "heartbeat" and data.get("action") == "ping":
                connection_manager.update_heartbeat(user_id)
                await websocket.send_json({
                    "type": "heartbeat",
                    "action": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue

            # ACK 确认
            if data.get("type") == "ack":
                seq = data.get("seq")
                logger.info(f"[WS/Push] 用户 {user_id} 确认消息 seq={seq}")
                continue

            # sync 消息（重连后同步）
            if data.get("type") == "sync":
                await websocket.send_json({
                    "type": "sync_ack",
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue

    except WebSocketDisconnect:
        logger.info(f"[WS/Push] 用户 {user_id} 断开连接")
    except Exception as e:
        logger.error(f"[WS/Push] 用户 {user_id} 错误: {e}")
    finally:
        connection_manager.set_connection_status(user_id, "disconnected")
        await connection_manager.disconnect_ws(user_id)
```

**Step 2: 更新推送方法使用 seq**

在 `reminder_tasks.py` 中更新 `test_sse_push` 函数，改用 WebSocket:

```python
async def test_sse_push(user_id: int):
    """测试 SSE 推送（兼容 WebSocket）"""
    from app.services.connection_manager import connection_manager
    from datetime import datetime

    logger.info(f"[SSE] 发送测试推送给用户 {user_id}")

    # 优先使用 WebSocket，其次使用 SSE
    if user_id in connection_manager.ws_connections:
        seq = connection_manager.get_next_seq(user_id)
        message = {
            "type": "push",
            "action": "reminder",
            "data": {
                "id": 0,
                "title": "🧪 测试推送",
                "body": "这是一条 WebSocket 测试推送！",
                "reminder_type": "test"
            },
            "timestamp": datetime.utcnow().isoformat(),
            "seq": seq
        }
        await connection_manager.send_ws_message(user_id, message)
        logger.info(f"[SSE] WebSocket 测试推送成功 seq={seq}")
        return True
    elif user_id in connection_manager.sse_connections:
        # SSE 兼容
        message = {
            "type": "reminder",
            "id": 0,
            "title": "🧪 测试推送",
            "body": "这是一条 SSE 测试推送！",
            "reminder_type": "test"
        }
        await connection_manager.push_sse_notification(user_id, message)
        logger.info(f"[SSE] SSE 测试推送成功")
        return True
    else:
        logger.warning(f"[SSE] 用户 {user_id} 可能没有连接 SSE")
        return False
```

**Step 3: 提交代码**

```bash
git add backend/app/api/endpoints/websocket.py backend/app/tasks/reminder_tasks.py
git commit -m "feat: 新增 /ws/push 推送通道端点"
```

---

### Task 3: 重写 APP WebSocket 客户端

**Files:**
- Modify: `APP/src/services/webSocketService.ts`

**Step 1: 实现统一 WebSocket 客户端**

```typescript
// 统一 WebSocket 服务 - 推送通知 + AI 对话
import { getToken } from './auth';
import { API_BASE_URL } from './config';
import { reminderNotificationService } from './reminderNotificationService';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

export interface WSMessage {
  type: string;
  action?: string;
  data?: any;
  timestamp?: string;
  seq?: number;
}

export interface WSCallbacks {
  onPush?: (data: any) => void;
  onChatChunk?: (content: string) => void;
  onChatDone?: (fullContent: string) => void;
  onChatError?: (error: string) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WSCallbacks | null = null;

  // 连接配置
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private heartbeatInterval = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  // 状态
  private reconnectAttempts = 0;
  private status: ConnectionStatus = {
    state: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  };

  // AI 对话临时状态
  private currentChatCallbacks: {
    onChunk?: (content: string) => void;
    onDone?: (fullContent: string) => void;
    onError?: (error: string) => void;
  } | null = null;
  private fullResponse = '';

  // 获取 WebSocket URL
  private getWsUrl = (): string => {
    return `${API_BASE_URL.replace('http', 'ws')}/ws/push`;
  };

  // 连接
  connect = async (callbacks?: WSCallbacks): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('[WS] 未登录，无法连接');
        return false;
      }

      this.callbacks = callbacks || null;
      this.updateStatus({ state: 'connecting' });

      // 断开旧连接
      this.disconnect();

      const wsUrl = `${this.getWsUrl()}?token=${token}`;
      console.log('[WS] 正在连接推送通道...');

      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        this.ws.onopen = () => {
          console.log('[WS] 连接已建立');
          this.reconnectAttempts = 0;
          this.updateStatus({
            state: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null
          });
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('[WS] 解析消息失败:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] 连接错误:', error);
          this.updateStatus({ state: 'error', error: 'WebSocket 连接错误' });
          if (callbacks?.onConnectionChange) {
            callbacks.onConnectionChange(this.status);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WS] 连接已关闭:', event.code, event.reason);
          this.stopHeartbeat();
          this.updateStatus({ state: 'disconnected' });

          // 自动重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }

          if (callbacks?.onConnectionChange) {
            callbacks.onConnectionChange(this.status);
          }
        };
      });
    } catch (error) {
      console.error('[WS] 连接失败:', error);
      this.updateStatus({ state: 'error', error: String(error) });
      return false;
    }
  };

  // 断开连接
  disconnect = () => {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus({ state: 'disconnected' });
  };

  // 处理消息
  private handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('[WS] 已连接:', message);
        // 重连后发送 sync
        this.send({ type: 'sync' });
        break;

      case 'push':
        // 推送通知
        if (message.action === 'reminder') {
          this.handleReminder(message);
        }
        // 发送 ACK
        if (message.seq) {
          this.send({ type: 'ack', seq: message.seq });
        }
        break;

      case 'heartbeat':
        if (message.action === 'pong') {
          console.log('[WS] 心跳响应');
        }
        break;

      case 'chat':
        // AI 对话响应
        if (message.action === 'chunk') {
          this.fullResponse += message.data?.content || '';
          if (this.currentChatCallbacks?.onChunk) {
            this.currentChatCallbacks.onChunk(message.data?.content || '');
          }
        } else if (message.action === 'done') {
          if (this.currentChatCallbacks?.onDone) {
            this.currentChatCallbacks.onDone(this.fullResponse);
          }
          this.currentChatCallbacks = null;
          this.fullResponse = '';
        }
        break;

      case 'error':
        console.error('[WS] 收到错误:', message.data?.error);
        if (this.currentChatCallbacks?.onError) {
          this.currentChatCallbacks.onError(message.data?.error || '未知错误');
        }
        break;

      default:
        console.log('[WS] 收到未知消息:', message);
    }
  };

  // 处理养护提醒
  private handleReminder = (message: WSMessage) => {
    console.log('[WS] 收到养护提醒:', message.data?.title, message.data?.body);

    reminderNotificationService.triggerNotification(
      message.data?.title || '🌱 养护提醒',
      message.data?.body || '',
      {
        type: 'ws_reminder',
        reminder_id: message.data?.id,
        reminder_type: message.data?.reminder_type,
      }
    );

    // 回调
    if (this.callbacks?.onPush) {
      this.callbacks.onPush(message.data);
    }
  };

  // 发送消息
  private send = (data: any) => {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  };

  // 心跳
  private startHeartbeat = () => {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', action: 'ping' });
      }
    }, this.heartbeatInterval);
  };

  private stopHeartbeat = () => {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  };

  // 重连调度
  private scheduleReconnect = () => {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[WS] ${delay/1000}s 后重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.updateStatus({ reconnectAttempts: this.reconnectAttempts });

    setTimeout(() => {
      if (this.status.state !== 'connected') {
        this.connect(this.callbacks || undefined);
      }
    }, delay);
  };

  // 更新状态
  private updateStatus = (partial: Partial<ConnectionStatus>) => {
    this.status = { ...this.status, ...partial };
  };

  // 获取状态
  getStatus = (): ConnectionStatus => this.status;

  // 获取连接状态
  isConnected = (): boolean => {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  };
}

export const webSocketService = new WebSocketService();
export default webSocketService;
```

**Step 2: 提交代码**

```bash
git add APP/src/services/webSocketService.ts
git commit -m "refactor: 重写 WebSocket 客户端为统一推送服务"
```

---

### Task 4: 更新 App.tsx 集成统一 WebSocket

**Files:**
- Modify: `APP/App.tsx`

**Step 1: 更新 App.tsx**

```typescript
// App.tsx 中的相关改动

import { webSocketService } from './src/services/webSocketService';

// 在 checkLoginAndConnectSSE 函数中改为使用统一 WebSocket
const checkLoginAndConnectSSE = async () => {
  try {
    const token = await getToken();
    if (token) {
      setIsLoggedIn(true);
      console.log('[App] 用户已登录，连接 WebSocket 推送通道...');
      // 连接统一 WebSocket 服务
      webSocketService.connect({
        onPush: (data) => {
          console.log('[App] 收到推送:', data);
        },
        onConnectionChange: (status) => {
          console.log('[App] WebSocket 状态:', status.state);
        }
      });
    } else {
      console.log('[App] 用户未登录，断开 WebSocket');
      webSocketService.disconnect();
    }
  } catch (error) {
    console.error('[App] 检查登录状态失败:', error);
  }
};

// 在 useEffect return 中断开连接
return () => {
  unsubscribe();
  webSocketService.disconnect();  // 改为 WebSocket
};
```

**Step 2: 提交代码**

```bash
git add APP/App.tsx
git commit -m "feat: 集成统一 WebSocket 推送服务"
```

---

### Task 5: 测试验证

**Step 1: 启动后端服务**

```bash
cd /Users/ember/Flower_Guardian/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Step 2: 测试 WebSocket 连接**

在新终端中运行:

```bash
cd /Users/ember/Flower_Guardian/backend
source venv/bin/activate
python3 -c "
import asyncio
import websockets
import json

async def test():
    # 先登录获取 token
    import requests
    resp = requests.post('http://localhost:8000/api/users/login',
                         data={'username': 'ember', 'password': '123456'})
    token = resp.json()['access_token']
    print(f'Token: {token[:50]}...')

    # 连接 WebSocket
    uri = f'ws://localhost:8000/ws/push?token={token}'
    print(f'Connecting to {uri}...')

    async with websockets.connect(uri) as ws:
        # 接收连接成功消息
        msg = await ws.recv()
        print(f'Received: {msg}')

        # 发送心跳
        await ws.send(json.dumps({'type': 'heartbeat', 'action': 'ping'}))
        pong = await ws.recv()
        print(f'Pong: {pong}')

        print('WebSocket 连接测试成功!')

asyncio.run(test())
"
```

**Step 3: 测试推送功能**

```bash
cd /Users/ember/Flower_Guardian/backend
source venv/bin/activate
python3 -c "
from app.tasks.reminder_tasks import test_sse_push
import asyncio

asyncio.run(test_sse_push(user_id=2))
"
```

**Step 4: 提交最终代码**

```bash
git add -A
git commit -m "feat: 完成 WebSocket 统一实时通信通道

- 后端: 新增 /ws/push 推送通道
- APP: 重写 WebSocket 客户端
- 功能: 自动重连、心跳保活、离线队列
"
```

---

## 验收标准

1. **连接成功**: APP 登录后 WebSocket 连接成功，状态为 `connected`
2. **心跳正常**: 每 30 秒发送心跳，服务端响应 pong
3. **推送到达**: 后端发送 `test_sse_push`，APP 立即收到通知
4. **自动重连**: 断线后自动重连，指数退避
5. **状态反馈**: `onConnectionChange` 回调正确触发

## 依赖项

无新增依赖，使用 React Native 原生 WebSocket API。
