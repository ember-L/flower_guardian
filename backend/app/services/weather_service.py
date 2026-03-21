# 天气服务 - 和风天气API
import httpx
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# 和风天气API配置
HEFENG_KEY = settings.HEFENG_KEY
HEFENG_BASE = "https://devapi.qweather.com/v7"


async def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    获取天气数据

    Args:
        latitude: 纬度
        longitude: 经度

    Returns:
        天气数据字典
    """
    if not HEFENG_KEY:
        raise ValueError("和风天气API未配置")

    # 先调用地理编码API获取城市名称
    location_name = "未知"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            geo_url = "https://geoapi.qweather.com/v2/city/lookup"
            geo_params = {
                "location": f"{longitude},{latitude}",
                "key": HEFENG_KEY
            }
            geo_resp = await client.get(geo_url, params=geo_params)
            if geo_resp.status_code == 200:
                geo_json = geo_resp.json()
                if geo_json.get("code") == "200" and geo_json.get("location"):
                    location_name = geo_json["location"][0].get("name", "未知")
    except Exception as e:
        logger.warning(f"获取城市名称失败: {e}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        weather_url = f"{HEFENG_BASE}/weather/now"
        weather_params = {
            "location": f"{longitude},{latitude}",
            "key": HEFENG_KEY
        }
        weather_resp = await client.get(weather_url, params=weather_params)

        if weather_resp.status_code != 200:
            raise Exception("获取天气数据失败")

        weather_json = weather_resp.json()
        now_data = weather_json.get("now", {})

        # 获取空气质量
        air_url = f"{HEFENG_BASE}/air/now"
        air_resp = await client.get(air_url, params=weather_params)
        air_data = air_resp.json().get("now", {}) if air_resp.status_code == 200 else {}

        # 获取每日预报（包含最高最低温度）
        daily_url = f"{HEFENG_BASE}/weather/7d"
        daily_resp = await client.get(daily_url, params=weather_params)
        daily_data = daily_resp.json().get("daily", [])[0] if daily_resp.status_code == 200 else {}

        # 构造天气数据
        weather_info = {
            "temp": int(now_data.get("temp", 0)),
            "tempMax": int(daily_data.get("tempMax", 0)),
            "tempMin": int(daily_data.get("tempMin", 0)),
            "humidity": int(now_data.get("humidity", 0)),
            "condition": now_data.get("text", "未知"),
            "conditionIcon": now_data.get("icon", ""),
            "airQuality": air_data.get("aqi", air_data.get("category", "未知")),
            "uvIndex": int(now_data.get("uvIndex", 0)),
            "windSpeed": now_data.get("windScale", "未知") + "级",
            "location": location_name
        }

        logger.info(f"获取天气数据成功: {weather_info.get('location')}")
        return weather_info
