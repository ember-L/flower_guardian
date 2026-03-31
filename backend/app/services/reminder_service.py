from datetime import datetime
from typing import Optional
from app.models.plant import Plant


# 水需求到基础间隔天数映射
WATER_REQUIREMENT_INTERVAL = {
    "frequent": 3,
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
}


def get_season_factor() -> float:
    """根据当前月份返回季节系数"""
    month = datetime.utcnow().month
    if month in [6, 7, 8]:  # 夏季
        return 0.7
    elif month in [12, 1, 2]:  # 冬季
        return 1.3
    return 1.0  # 春秋季


def get_weather_factor(
    temperature: Optional[float] = None,
    humidity: Optional[float] = None,
    precipitation: Optional[float] = None
) -> float:
    """根据天气数据计算浇水系数"""
    factor = 1.0

    if temperature is not None:
        if temperature > 30:
            factor *= 0.8  # 高温提前浇水
        elif temperature < 5:
            factor *= 1.2  # 低温延迟浇水

    if humidity is not None:
        if humidity > 80:
            factor *= 1.3  # 高湿延迟
        elif humidity < 30:
            factor *= 0.9  # 干燥提前

    if precipitation is not None and precipitation > 0:
        factor *= 1.3  # 下雨延迟

    return factor


def calculate_smart_interval(
    plant: Optional[Plant],
    weather_factor: float = 1.0,
    season_factor: Optional[float] = None
) -> int:
    """计算智能浇水间隔"""
    if season_factor is None:
        season_factor = get_season_factor()

    if plant and plant.water_requirement:
        base_interval = WATER_REQUIREMENT_INTERVAL.get(
            plant.water_requirement, 7
        )
    else:
        base_interval = 7  # 默认7天

    calculated = int(base_interval * season_factor * weather_factor)
    return max(1, calculated)  # 至少1天


def generate_weather_tip(
    weather_factor: float,
    season_factor: float
) -> Optional[str]:
    """生成天气提示文字"""
    tips = []

    if season_factor < 1.0:
        tips.append("夏季炎热，建议提前浇水")
    elif season_factor > 1.0:
        tips.append("冬季寒冷，可适当延迟浇水")

    if weather_factor < 1.0:
        tips.append("天气炎热，注意补水")
    elif weather_factor > 1.0:
        tips.append("天气湿润，可延迟浇水")

    return "；".join(tips) if tips else None
