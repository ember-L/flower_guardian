# 天气相关 Schemas
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WeatherData(BaseModel):
    """天气数据"""
    temp: int
    tempMax: int
    tempMin: int
    humidity: int
    condition: str
    conditionIcon: str
    airQuality: str
    uvIndex: int
    windSpeed: str
    location: str


class WeatherTipResponse(BaseModel):
    """天气+小贴士响应"""
    weather: WeatherData
    tip: str


class LocationRequest(BaseModel):
    """位置请求"""
    latitude: float
    longitude: float


class WeatherQueryBase(BaseModel):
    """天气查询基础"""
    latitude: float
    longitude: float
    location: Optional[str] = None


class WeatherQueryCreate(WeatherQueryBase):
    """天气查询创建"""
    temp: Optional[int] = None
    temp_max: Optional[int] = None
    temp_min: Optional[int] = None
    humidity: Optional[int] = None
    condition: Optional[str] = None
    air_quality: Optional[str] = None
    uv_index: Optional[int] = None
    wind_speed: Optional[str] = None
    tip: Optional[str] = None


class WeatherQueryResponse(WeatherQueryBase):
    """天气查询响应"""
    id: int
    temp: Optional[int] = None
    temp_max: Optional[int] = None
    temp_min: Optional[int] = None
    humidity: Optional[int] = None
    condition: Optional[str] = None
    air_quality: Optional[str] = None
    uv_index: Optional[int] = None
    wind_speed: Optional[str] = None
    tip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
