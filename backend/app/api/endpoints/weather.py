# 天气和AI小贴士API
from fastapi import APIRouter, HTTPException
import logging

from app.schemas.weather import LocationRequest, WeatherTipResponse
from app.services.weather_service import get_weather_data
from app.services.ai_service import generate_plant_tip

router = APIRouter(prefix="/api/weather", tags=["weather"])

logger = logging.getLogger(__name__)


@router.post("/tips", response_model=WeatherTipResponse)
async def get_weather_tips(request: LocationRequest):
    """根据经纬度获取天气并生成AI小贴士"""
    try:
        # 获取天气数据
        weather_info = await get_weather_data(request.latitude, request.longitude)

        # 调用AI生成小贴士
        tip = await generate_plant_tip(weather_info)

        logger.info(f"生成小贴士成功: {tip[:50]}...")

        return {
            "weather": weather_info,
            "tip": tip
        }

    except ValueError as e:
        logger.error(f"配置错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"获取天气失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取天气失败: {str(e)}")
