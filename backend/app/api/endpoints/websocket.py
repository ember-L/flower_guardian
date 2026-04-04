# WebSocket 端点
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from datetime import datetime
import logging

from app.services.connection_manager import connection_manager
from app.services.ai_service import chat_stream

router = APIRouter(prefix="/ws", tags=["websocket"])
logger = logging.getLogger(__name__)

# JWT 配置
from app.core.config import settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


def verify_token(token: str) -> Optional[dict]:
    """验证 JWT Token，返回用户信息"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_sub = payload.get("sub")  # 可能是用户名或用户ID
        exp = payload.get("exp")

        # 尝试获取用户 ID
        user_id = None
        if user_sub:
            # 如果是数字字符串，转为整数
            try:
                user_id = int(user_sub)
            except ValueError:
                # 是用户名，需要查询数据库
                from app.core.database import SessionLocal
                from app.models.user import User
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.username == user_sub).first()
                    if user:
                        user_id = user.id
                finally:
                    db.close()

        return {
            "user_id": user_id,
            "username": user_sub,
            "exp": exp
        }
    except JWTError as e:
        logger.warning(f"Token 验证失败: {e}")
    except Exception as e:
        logger.warning(f"Token 解析失败: {e}")
    return None


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
    # 验证 Token
    token_data = verify_token(token)
    if not token_data or not token_data.get("user_id"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = token_data["user_id"]

    # 接受连接
    await websocket.accept()
    await connection_manager.connect_ws(user_id, websocket)

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

            # 未知消息类型
            logger.warning(f"[WS/Push] 用户 {user_id} 收到未知消息: {data.get('type')}")

    except WebSocketDisconnect:
        logger.info(f"[WS/Push] 用户 {user_id} 断开连接")
    except Exception as e:
        logger.error(f"[WS/Push] 用户 {user_id} 错误: {e}")
    finally:
        connection_manager.set_connection_status(user_id, "disconnected")
        await connection_manager.disconnect_ws(user_id)


# ==================== WebSocket 端点 - AI 流式对话 ====================

@router.websocket("/ai/chat")
async def websocket_ai_chat(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket 端点 - AI 流式对话

    连接方式:
    ws://host/ws/ai/chat?token=JWT

    客户端发送:
    {
        "type": "message",
        "content": "用户的问题",
        "conversation_id": 123,  // 可选
        "system_context": "植物诊断"  // 可选
    }

    服务端推送:
    {
        "type": "chat",
        "action": "chunk",
        "data": {"content": "AI正在回复..."}
    }
    {
        "type": "chat",
        "action": "done",
        "data": {"content": "完整的回复"}
    }
    {
        "type": "error",
        "data": {"error": "错误信息"}
    }
    """
    # 验证 Token
    token_data = verify_token(token)
    if not token_data or not token_data.get("user_id"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = token_data["user_id"]

    # 接受连接
    await websocket.accept()
    await connection_manager.connect_ws(user_id, websocket)
    connection_manager.update_heartbeat(user_id)

    logger.info(f"[WS/Chat] 用户 {user_id} ({token_data.get('username')}) AI 对话 WebSocket 连接已建立")

    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()

            # 兼容旧格式
            if data.get("type") == "message":
                data = {
                    "type": "chat",
                    "action": "message",
                    "data": {
                        "content": data.get("content", ""),
                        "conversation_id": data.get("conversation_id"),
                        "system_context": data.get("system_context")
                    }
                }

            if data.get("type") == "chat" and data.get("action") == "message":
                content = data.get("data", {}).get("content", "")
                conversation_id = data.get("data", {}).get("conversation_id")
                system_context = data.get("data", {}).get(
                    "system_context",
                    "你是一个专业的植物医生，帮助用户解答植物养护问题。"
                )

                if not content:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"error": "消息内容不能为空"}
                    })
                    continue

                logger.info(f"[WS/Chat] 用户 {user_id} 发送消息: {content[:50]}...")

                # 调用 AI 服务（流式）
                try:
                    messages = [{"role": "user", "content": content}]
                    full_response = ""

                    # 流式调用 AI
                    async for chunk in chat_stream(messages=messages, system_context=system_context):
                        full_response += chunk
                        await websocket.send_json({
                            "type": "chat",
                            "action": "chunk",
                            "data": {"content": chunk}
                        })

                    # 发送完成消息
                    await websocket.send_json({
                        "type": "chat",
                        "action": "done",
                        "data": {"content": full_response}
                    })

                    logger.info(f"[WS/Chat] AI 回复完成，长度: {len(full_response)}")

                except Exception as e:
                    logger.error(f"[WS/Chat] AI 服务错误: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "data": {"error": f"AI 服务错误: {str(e)}"}
                    })

            elif data.get("type") == "heartbeat" and data.get("action") == "ping":
                # 心跳响应
                connection_manager.update_heartbeat(user_id)
                await websocket.send_json({
                    "type": "heartbeat",
                    "action": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })

            else:
                logger.warning(f"[WS/Chat] 用户 {user_id} 未知消息类型: {data.get('type')}")

    except WebSocketDisconnect:
        logger.info(f"[WS/Chat] 用户 {user_id} WebSocket 断开连接")
    except Exception as e:
        logger.error(f"[WS/Chat] WebSocket 错误: {e}")
    finally:
        await connection_manager.disconnect_ws(user_id)
