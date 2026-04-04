# 连接管理器 - 管理 WebSocket 连接
from typing import Dict, Optional, Any
from fastapi import WebSocket
from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """管理所有 WebSocket 实时连接"""

    def __init__(self):
        # WebSocket 连接: user_id -> WebSocket
        self.ws_connections: Dict[int, WebSocket] = {}

        # 连接状态跟踪: user_id -> {status, last_update}
        self.connection_status: Dict[int, Dict[str, Any]] = {}

        # 心跳跟踪: user_id -> datetime
        self.last_heartbeat: Dict[int, datetime] = {}

        # 序列号生成器: user_id -> seq
        self._sequence: Dict[int, int] = defaultdict(int)

    # ==================== 序列号 ====================

    def get_next_seq(self, user_id: int) -> int:
        """获取下一个序列号"""
        self._sequence[user_id] += 1
        return self._sequence[user_id]

    # ==================== 连接状态 ====================

    def set_connection_status(self, user_id: int, status: str):
        """设置连接状态"""
        self.connection_status[user_id] = {
            "status": status,
            "last_update": datetime.utcnow()
        }

    def get_connection_status(self, user_id: int) -> Optional[Dict]:
        """获取连接状态"""
        return self.connection_status.get(user_id)

    # ==================== 心跳 ====================

    def update_heartbeat(self, user_id: int):
        """更新心跳时间"""
        self.last_heartbeat[user_id] = datetime.utcnow()

    def is_heartbeat_timeout(self, user_id: int, timeout_seconds: int = 60) -> bool:
        """检查心跳是否超时"""
        if user_id not in self.last_heartbeat:
            return True  # 从未收到心跳视为超时
        elapsed = (datetime.utcnow() - self.last_heartbeat[user_id]).total_seconds()
        return elapsed > timeout_seconds

    # ==================== WebSocket ====================

    async def connect_ws(self, user_id: int, websocket: WebSocket):
        """添加 WebSocket 连接"""
        # 先关闭旧连接
        if user_id in self.ws_connections:
            try:
                await self.ws_connections[user_id].close()
            except Exception:
                pass

        self.ws_connections[user_id] = websocket
        self.set_connection_status(user_id, "connected")
        self.update_heartbeat(user_id)
        logger.info(f"[WS] 用户 {user_id} WebSocket 连接已建立")

    async def disconnect_ws(self, user_id: int):
        """移除 WebSocket 连接"""
        if user_id in self.ws_connections:
            del self.ws_connections[user_id]
            self.set_connection_status(user_id, "disconnected")
            logger.info(f"[WS] 用户 {user_id} WebSocket 连接已断开")

    async def send_ws_message(self, user_id: int, message: dict) -> bool:
        """向指定用户的 WebSocket 发送消息"""
        if user_id in self.ws_connections:
            try:
                await self.ws_connections[user_id].send_json(message)
                return True
            except Exception as e:
                logger.error(f"[WS] 发送消息失败: {e}")
                await self.disconnect_ws(user_id)
                return False
        return False

    # ==================== 推送通知 ====================

    async def push_notification(self, user_id: int, data: dict) -> bool:
        """向指定用户推送通知"""
        if user_id in self.ws_connections:
            seq = self.get_next_seq(user_id)
            message = {
                "type": "push",
                **data,
                "timestamp": datetime.utcnow().isoformat(),
                "seq": seq
            }
            result = await self.send_ws_message(user_id, message)
            if result:
                logger.info(f"[Push] 推送成功 seq={seq} -> 用户 {user_id}")
            return result
        else:
            logger.warning(f"[Push] 用户 {user_id} 未连接")
            return False

    # ==================== 广播 ====================

    async def broadcast(self, message: dict):
        """广播消息到所有 WebSocket 连接"""
        for user_id in list(self.ws_connections.keys()):
            await self.send_ws_message(user_id, message)

    # ==================== 状态 ====================

    def get_online_count(self) -> int:
        """获取在线用户数"""
        return len(self.ws_connections)

    def is_user_online(self, user_id: int) -> bool:
        """检查用户是否在线"""
        return user_id in self.ws_connections


# 全局连接管理器实例
connection_manager = ConnectionManager()
