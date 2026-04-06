import { getToken as getAuthToken } from './auth';
import { API_BASE_URL } from './config';

export interface WSCallbacks {
  onPush?: (data: any) => void;
  onChatMessage?: (message: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

interface WSMessage {
  type?: string;
  action?: string;
  data?: any;
  content?: string;
  seq?: number;
  timestamp?: string;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private heartbeatInterval = 30000;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: WSCallbacks = {};
  private isManualClose = false;
  private isConnected = false;

  private pushWs: WebSocket | null = null;
  private pushReconnectAttempts = 0;
  private pushHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pushCallbacks: WSCallbacks = {};

  connect = async (callbacks?: WSCallbacks): Promise<boolean> => {
    this.callbacks = callbacks || {};
    this.isManualClose = false;

    const token = await getAuthToken();
    if (!token) {
      console.log('[WS/Chat] No auth token, skipping connection');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/ai/chat?token=${token}`;
        console.log('[WS/Chat] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WS/Chat] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.callbacks.onConnected?.();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            console.log('[WS/Chat] Received:', message);

            // 心跳响应
            if (message.type === 'heartbeat' && message.action === 'pong') {
              // 收到 pong，连接正常
            } else if (message.type === 'connected') {
              // 连接成功
              console.log('[WS/Chat] Server confirmed connection');
            } else {
              this.handleMessage(message);
            }
          } catch (e) {
            console.log('[WS/Chat] Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS/Chat] Error:', error);
          this.callbacks.onError?.(error);
        };

        this.ws.onclose = () => {
          console.log('[WS/Chat] Disconnected');
          this.isConnected = false;
          this.stopHeartbeat();
          this.callbacks.onDisconnected?.();
          this.scheduleReconnect();
        };
      } catch (e) {
        console.error('[WS/Chat] Connection failed:', e);
        resolve(false);
      }
    });
  };

  private startHeartbeat = () => {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
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

  private scheduleReconnect = () => {
    if (this.isManualClose || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[WS/Chat] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.callbacks);
    }, delay);
  };

  send = (data: any): boolean => {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  sendChatMessage = (content: string, context?: any): boolean => {
    const message: any = { content };
    if (context) {
      message.context = context;
    }
    return this.send(message);
  };

  private handleMessage = (message: WSMessage) => {
    if (message.action === 'push') {
      this.callbacks.onPush?.(message.data);
    } else {
      this.callbacks.onChatMessage?.(message);
    }
  };

  disconnectChat = () => {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  };

  disconnect = () => this.disconnectChat();

  // Push notification WebSocket
  connectPush = async (callbacks?: WSCallbacks): Promise<boolean> => {
    this.pushCallbacks = callbacks || {};

    const token = await getAuthToken();
    if (!token) {
      // 未登录，不显示日志
      return false;
    }

    return new Promise((resolve) => {
      try {
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/push?token=${token}`;
        this.pushWs = new WebSocket(wsUrl);

        this.pushWs.onopen = () => {
          this.pushReconnectAttempts = 0;
          this.startPushHeartbeat();
          this.pushCallbacks.onConnected?.();
          resolve(true);
        };

        this.pushWs.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            // 心跳响应
            if (message.type === 'heartbeat' && message.action === 'pong') {
              // 收到 pong，忽略
            } else {
              this.handlePushMessage(message);
            }
          } catch (e) {
            console.log('[WS/Push] Parse error:', e);
          }
        };

        this.pushWs.onerror = (error) => {
          console.log('[WS/Push] onerror fired');
          // 不打印错误详情，避免日志过长
          resolve(false);
        };

        this.pushWs.onclose = (event) => {
          // 403 错误不重连（可能是 token 过期或后端不可用）
          if (event.code === 403) {
            this.stopPushHeartbeat();
            resolve(false);
            return;
          }
          this.stopPushHeartbeat();
          this.pushCallbacks.onDisconnected?.();
          this.schedulePushReconnect();
          resolve(false);
        };

        // 超时处理
        setTimeout(() => {
          if (this.pushWs?.readyState !== WebSocket.OPEN) {
            this.pushWs?.close();
          }
        }, 10000);
      } catch {
        resolve(false);
      }
    });
  };

  private startPushHeartbeat = () => {
    this.stopPushHeartbeat();
    this.pushHeartbeatTimer = setInterval(() => {
      if (this.pushWs?.readyState === WebSocket.OPEN) {
        this.sendPush({ type: 'heartbeat', action: 'ping' });
      }
    }, this.heartbeatInterval);
  };

  private stopPushHeartbeat = () => {
    if (this.pushHeartbeatTimer) {
      clearInterval(this.pushHeartbeatTimer);
      this.pushHeartbeatTimer = null;
    }
  };

  private schedulePushReconnect = () => {
    if (this.isManualClose || this.pushReconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.pushReconnectAttempts);
    console.log(`[WS/Push] Reconnecting in ${delay}ms (attempt ${this.pushReconnectAttempts + 1})`);

    setTimeout(() => {
      this.pushReconnectAttempts++;
      this.connectPush(this.pushCallbacks);
    }, delay);
  };

  sendPush = (data: any): boolean => {
    if (this.pushWs?.readyState === WebSocket.OPEN) {
      this.pushWs.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  private handlePushMessage = (message: WSMessage) => {
    if (message.type === 'push') {
      this.pushCallbacks.onPush?.(message.data);
    }
  };

  disconnectPush = () => {
    this.isManualClose = true;
    this.stopPushHeartbeat();
    if (this.pushWs) {
      this.pushWs.close();
      this.pushWs = null;
    }
  };

  // 断开但不阻止重连（用于应用切后台）
  pausePush = () => {
    this.stopPushHeartbeat();
    if (this.pushWs) {
      this.pushWs.close();
      this.pushWs = null;
    }
  };

  isPushConnected = () => {
    return this.pushWs?.readyState === WebSocket.OPEN;
  };

  isChatConnected = () => {
    return this.ws?.readyState === WebSocket.OPEN;
  };
}

export const webSocketService = new WebSocketService();
