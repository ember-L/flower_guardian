# WebSocket 统一实时通信通道设计方案

> **日期**: 2026-04-03
> **状态**: 已确认

## 1. 背景

当前系统使用轮询机制实现推送通知，存在 30 秒延迟问题。同时 SSE 在 React Native 中兼容性较差。需要建立统一的 WebSocket 实时通信通道，替代现有的轮询 + SSE 混合方案。

## 2. 设计目标

- **实时性**: 推送通知即时到达，无轮询延迟
- **可靠性**: 自动重连、心跳保活、离线消息队列
- **统一性**: 所有实时通信统一走 WebSocket 通道
- **兼容性**: 支持 iOS/Android/React Native

## 3. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      APP (React Native)                      │
├─────────────────────────────────────────────────────────────┤
│  WebSocketService (统一客户端)                               │
│  ├── 自动重连 (指数退避)                                      │
│  ├── 心跳保活 (每 30s)                                       │
│  ├── 离线消息队列                                            │
│  └── 连接状态监听                                            │
├─────────────────────────────────────────────────────────────┤
│  消息分发器                                                  │
│  ├── AI对话消息 → webSocketService                          │
│  └── 推送通知 → reminderNotificationService                  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                         │
├─────────────────────────────────────────────────────────────┤
│  /ws/chat (AI 流式对话 - 保留)                              │
│  /ws/push (推送通知 + 心跳)                                  │
├─────────────────────────────────────────────────────────────┤
│  ConnectionManager                                          │
│  ├── WebSocket 连接池                                        │
│  ├── 用户会话管理                                            │
│  └── 消息路由                                                │
└─────────────────────────────────────────────────────────────┘
```

## 4. WebSocket 端点设计

### 4.1 推送通道 `/ws/push`

**用途**: 接收后端推送的养护提醒、系统通知

**连接**: `ws://host/ws/push?token=JWT`

**客户端接收消息格式**:
```json
{
  "type": "push",
  "action": "reminder",
  "data": {
    "id": 1,
    "title": "🌱 养护提醒",
    "body": "您的\"小绿\"需要浇水啦！",
    "reminder_type": "water",
    "plant_name": "小绿"
  },
  "timestamp": "2026-04-03T12:00:00Z",
  "seq": 123
}
```

**客户端心跳**:
```json
{"type": "heartbeat", "action": "ping"}
```

**服务端响应**:
```json
{"type": "heartbeat", "action": "pong", "timestamp": "..."}
```

**消息 ACK**:
```json
{"type": "ack", "seq": 123}
```

### 4.2 AI 对话通道 `/ws/chat`

**用途**: AI 流式对话（保留现有功能）

**连接**: `ws://host/ws/chat?token=JWT`

**客户端发送**:
```json
{
  "type": "chat",
  "action": "message",
  "data": {
    "content": "我的绿萝叶子发黄怎么办？",
    "conversation_id": 123,
    "system_context": "你是一个专业的植物医生..."
  }
}
```

**服务端响应**:
```json
{"type": "chat", "action": "chunk", "data": {"content": "首先..."}}
{"type": "chat", "action": "done", "data": {"content": "完整回复"}}
```

## 5. 连接管理

### 5.1 自动重连机制

```
断线 → 等待 1s → 重连尝试
     → 失败 → 等待 2s → 重连
     → 失败 → 等待 4s → 重连
     → ...
     → 最大等待 30s
     → 最多重试 10 次
```

### 5.2 心跳保活

- APP 每 30 秒发送 `ping`
- 服务端响应 `pong`
- 超时 60 秒未响应视为断线

### 5.3 离线消息队列

- 断线期间的消息暂存到本地
- 重连后发送 `sync` 消息同步离线状态
- 服务端可选择性补发离线期间的消息

## 6. 消息分发器设计

```typescript
class MessageDispatcher {
  // 分发消息到对应处理器
  dispatch(message: WSMessage) {
    switch (message.type) {
      case 'push':
        // 推送通知
        this.handlePush(message);
        break;
      case 'chat':
        // AI 对话
        this.handleChat(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // 处理推送通知
  private handlePush(message: PushMessage) {
    if (message.action === 'reminder') {
      reminderNotificationService.triggerNotification(
        message.data.title,
        message.data.body,
        message.data
      );
    }
    // 发送 ACK
    this.sendAck(message.seq);
  }
}
```

## 7. 连接状态管理

```typescript
type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}
```

## 8. 文件改动清单

### 后端
| 文件 | 改动 |
|------|------|
| `app/api/endpoints/websocket.py` | 新增 `/ws/push` 端点，增强 `/ws/chat` |
| `app/services/connection_manager.py` | 增强消息路由、ACK 机制、状态管理 |

### APP
| 文件 | 改动 |
|------|------|
| `APP/src/services/webSocketService.ts` | 重写为统一客户端 |
| `APP/src/services/messageDispatcher.ts` | 新增消息分发器 |
| `APP/App.tsx` | 集成统一 WebSocket 服务 |

## 9. 测试计划

1. **单元测试**
   - WebSocket 服务重连逻辑
   - 消息分发器路由逻辑
   - 离线队列存取

2. **集成测试**
   - APP 与后端 WebSocket 连接
   - 推送通知到达测试
   - AI 对话流式响应测试

3. **压力测试**
   - 多用户并发连接
   - 断线重连稳定性

## 10. 兼容性考虑

- **iOS**: 支持 WebSocket，系统杀后台后自动重连
- **Android**: 支持 WebSocket，华为手机需要保活策略
- **React Native 0.74.6**: 原生 WebSocket API 支持
