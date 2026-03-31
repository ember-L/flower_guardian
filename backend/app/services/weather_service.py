# 天气服务 - 和风天气API + Open-Meteo (智能提醒用)
import httpx
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Open-Meteo API (免费，无需 API Key)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# 中国城市经纬度映射 (用于智能提醒)
CITY_COORDINATES = {
    "北京": (39.9042, 116.4074),
    "上海": (31.2304, 121.4737),
    "广州": (23.1291, 113.2644),
    "深圳": (22.5431, 114.0579),
    "杭州": (30.2741, 120.1551),
    "成都": (30.5728, 104.0668),
    "武汉": (30.5928, 114.3055),
    "西安": (34.3416, 108.9398),
    "南京": (32.0603, 118.7969),
    "重庆": (29.4316, 106.9123),
}


async def get_current_weather(location: str) -> Optional[Dict[str, Any]]:
    """获取当前位置天气 (用于智能提醒) - 使用 Open-Meteo"""
    coords = CITY_COORDINATES.get(location)
    if not coords:
        # 尝试用和风天气
        return await get_weather_for_smart_reminder(location)

    lat, lon = coords

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation",
        "timezone": "Asia/Shanghai"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OPEN_METEO_URL, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                return {
                    "temperature": current.get("temperature_2m"),
                    "humidity": current.get("relative_humidity_2m"),
                    "precipitation": current.get("precipitation"),
                    "location": location,
                    "source": "open-meteo"
                }
        except Exception as e:
            logger.warning(f"Open-Meteo API error: {e}")

    return None


async def get_weather_for_smart_reminder(location: str) -> Optional[Dict[str, Any]]:
    """使用和风天气API获取天气 (智能提醒用)"""
    if not HEFENG_KEY:
        return None

    # 先通过城市名获取坐标
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            geo_url = "https://geoapi.qweather.com/v2/city/lookup"
            geo_params = {
                "location": location,
                "key": HEFENG_KEY
            }
            geo_resp = await client.get(geo_url, params=geo_params)
            if geo_resp.status_code == 200:
                geo_json = geo_resp.json()
                if geo_json.get("code") == "200" and geo_json.get("location"):
                    geo = geo_json["location"][0]
                    lat, lon = float(geo.get("lat", 0)), float(geo.get("lon", 0))
                else:
                    return None
            else:
                return None
    except Exception as e:
        logger.warning(f"获取城市坐标失败: {e}")
        return None

    # 获取天气
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            weather_url = f"{HEFENG_BASE}/weather/now"
            weather_params = {
                "location": f"{lon},{lat}",
                "key": HEFENG_KEY
            }
            weather_resp = await client.get(weather_url, params=weather_params)
            if weather_resp.status_code == 200:
                weather_json = weather_resp.json()
                now_data = weather_json.get("now", {})
                return {
                    "temperature": float(now_data.get("temp", 0)),
                    "humidity": float(now_data.get("humidity", 0)),
                    "precipitation": float(now_data.get("precip", 0)),
                    "location": location,
                    "source": "qweather"
                }
    except Exception as e:
        logger.warning(f"和风天气API error: {e}")

    return None


def get_watering_advice(weather: Dict[str, Any]) -> str:
    """获取浇水建议"""
    temp = weather.get("temperature") or weather.get("temp")
    humidity = weather.get("humidity")
    precipitation = weather.get("precipitation")

    tips = []

    if temp is not None:
        if temp > 35:
            tips.append("高温预警！建议今天浇水")
        elif temp > 30:
            tips.append("天气炎热，可提前浇水")
        elif temp < 5:
            tips.append("低温寒冷，减少浇水")

    if humidity is not None:
        if humidity > 80:
            tips.append("湿度较高，可延迟浇水")
        elif humidity < 30:
            tips.append("空气干燥，建议浇水")

    if precipitation and precipitation > 0:
        tips.append("有降雨，可适当延迟")

    return "；".join(tips) if tips else "天气适宜，按正常间隔浇水"

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
