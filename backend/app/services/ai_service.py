# AI服务 - 阿里云DashScope
import httpx
import logging
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator

logger = logging.getLogger(__name__)

# DashScope配置
DASHSCOPE_API_KEY: Optional[str] = None
DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"


def init_ai_service():
    """初始化AI服务配置"""
    from app.core.config import settings
    global DASHSCOPE_API_KEY
    DASHSCOPE_API_KEY = settings.DASHSCOPE_API_KEY


# 植物专家系统提示
PLANT_DOCTOR_PROMPT = """你是一位专业、友善的植物医生和园艺专家。你的名字叫"小园"。

你可以帮助用户：
- 诊断植物病虫害问题
- 提供治疗和养护建议
- 解答日常养护疑问
- 制定施肥、浇水计划

请遵循以下原则：
1. 用温暖、耐心的语气与用户交流
2. 回答要专业但易懂，避免过多专业术语
3. 如果不确定某问题，可以建议用户拍照诊断
4. 适当使用emoji让对话更生动
5. 每次回答后可以适当关心用户"""

# 植物养护小贴士提示
PLANT_TIP_PROMPT = """你是一位专业、友善的植物医生和园艺专家。请根据以下天气信息，为用户生成简短实用的今日植物养护小贴士。

要求：
1. 最多3句话，简明扼要
2. 包含具体建议（如浇水、施肥、通风、遮阳等）
3. 根据天气情况给出针对性建议
4. 可以适当使用emoji让内容更生动
5. 不要重复描述天气情况，直接给出养护建议"""


async def chat(
    messages: List[Dict[str, str]],
    system_context: Optional[str] = None,
    model: str = "qwen-turbo",
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> str:
    """
    调用AI聊天接口

    Args:
        messages: 消息列表
        system_context: 系统上下文
        model: 模型名称
        temperature: 温度参数
        max_tokens: 最大token数

    Returns:
        AI回复内容
    """
    global DASHSCOPE_API_KEY

    if not DASHSCOPE_API_KEY:
        init_ai_service()

    if not DASHSCOPE_API_KEY:
        raise ValueError("DASHSCOPE_API_KEY未配置")

    # 构建消息
    all_messages = [{"role": "system", "content": PLANT_DOCTOR_PROMPT}]

    # 添加系统上下文
    if system_context:
        all_messages.append({"role": "system", "content": system_context})

    # 添加用户消息
    all_messages.extend(messages)

    logger.info(f"调用AI模型: {model}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                DASHSCOPE_URL,
                json={
                    "model": model,
                    "messages": all_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json"
                }
            )

        if response.status_code != 200:
            logger.error(f"AI API错误: {response.text}")
            raise Exception(f"AI服务调用失败: {response.text}")

        data = response.json()
        ai_response = data["choices"][0]["message"]["content"]

        logger.info(f"AI回复: {ai_response[:100]}...")
        return ai_response

    except httpx.TimeoutException:
        logger.error("AI服务响应超时")
        raise Exception("AI服务响应超时")
    except Exception as e:
        logger.error(f"AI服务错误: {str(e)}")
        raise


async def chat_stream(
    messages: List[Dict[str, str]],
    system_context: Optional[str] = None,
    model: str = "qwen-turbo",
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> AsyncGenerator[str, None]:
    """
    调用AI聊天接口 - 流式版本

    Args:
        messages: 消息列表
        system_context: 系统上下文
        model: 模型名称
        temperature: 温度参数
        max_tokens: 最大token数

    Yields:
        AI回复内容片段
    """
    global DASHSCOPE_API_KEY

    if not DASHSCOPE_API_KEY:
        init_ai_service()

    if not DASHSCOPE_API_KEY:
        raise ValueError("DASHSCOPE_API_KEY未配置")

    # 构建消息
    all_messages = [{"role": "system", "content": PLANT_DOCTOR_PROMPT}]

    # 添加系统上下文
    if system_context:
        all_messages.append({"role": "system", "content": system_context})

    # 添加用户消息
    all_messages.extend(messages)

    logger.info(f"流式调用AI模型: {model}")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                DASHSCOPE_URL,
                json={
                    "model": model,
                    "messages": all_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True
                },
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status_code != 200:
                    error_text = await response.atext()
                    logger.error(f"AI API错误: {error_text}")
                    raise Exception(f"AI服务调用失败: {error_text}")

                full_content = ""

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break

                        try:
                            import json
                            chunk_data = json.loads(data)
                            content = chunk_data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                full_content += content
                                yield content
                        except Exception:
                            continue

                logger.info(f"AI流式回复完成，长度: {len(full_content)}")

    except httpx.TimeoutException:
        logger.error("AI服务响应超时")
        raise Exception("AI服务响应超时")
    except Exception as e:
        logger.error(f"AI流式服务错误: {str(e)}")
        raise


async def generate_plant_tip(weather_data: Dict[str, Any]) -> str:
    """
    根据天气数据生成植物养护小贴士

    Args:
        weather_data: 天气数据字典

    Returns:
        AI生成的小贴士
    """
    global DASHSCOPE_API_KEY

    if not DASHSCOPE_API_KEY:
        init_ai_service()

    if not DASHSCOPE_API_KEY:
        return "今日请注意观察植物状态，保持适宜的浇水频率。"

    weather_text = f"""
今日天气信息：
- 温度：{weather_data.get('temp', '?')}°C（最高{weather_data.get('tempMax', '?')}°C，最低{weather_data.get('tempMin', '?')}°C）
- 湿度：{weather_data.get('humidity', '?')}%
- 天气状况：{weather_data.get('condition', '?')}
- 空气质量：{weather_data.get('airQuality', '?')}
- 紫外线指数：{weather_data.get('uvIndex', '?')}
- 风速：{weather_data.get('windSpeed', '?')}
"""

    messages = [
        {"role": "system", "content": PLANT_TIP_PROMPT},
        {"role": "user", "content": weather_text + "\n请根据以上天气信息给出今日植物养护建议。"}
    ]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                DASHSCOPE_URL,
                json={
                    "model": "qwen-turbo",
                    "messages": messages,
                    "temperature": 0.8,
                    "max_tokens": 200,
                },
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json"
                }
            )

        if response.status_code == 200:
            data = response.json()
            tip = data["choices"][0]["message"]["content"]
            logger.info(f"生成小贴士成功: {tip[:50]}...")
            return tip
        else:
            logger.error(f"AI API error: {response.text}")
            return "今日请注意观察植物状态，保持适宜的浇水频率。"

    except Exception as e:
        logger.error(f"AI生成失败: {str(e)}")
        return "今日请注意观察植物状态，保持适宜的浇水频率。"
