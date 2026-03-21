# AI聊天代理接口
from fastapi import APIRouter, HTTPException
import logging

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import chat as ai_chat

router = APIRouter(prefix="/api/ai", tags=["ai"])

logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI聊天接口"""
    logger.info("=" * 50)
    logger.info("收到AI聊天请求")

    # 打印用户消息
    user_messages = [msg.content for msg in request.messages if msg.role == "user"]
    if user_messages:
        logger.info(f"用户消息: {user_messages[-1][:100]}...")

    try:
        # 转换消息格式
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # 调用AI服务
        ai_response = await ai_chat(
            messages=messages,
            system_context=request.system_context
        )

        logger.info("=" * 50)
        logger.info("AI回复:")
        logger.info(ai_response)
        logger.info("=" * 50)

        return {
            "message": {
                "role": "assistant",
                "content": ai_response
            }
        }

    except ValueError as e:
        logger.warning(f"AI配置错误: {str(e)}")
        return {
            "message": {
                "role": "assistant",
                "content": "抱歉，AI服务暂时未配置。请联系管理员设置API密钥。"
            }
        }
    except Exception as e:
        logger.error(f"AI服务错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI服务错误: {str(e)}")
