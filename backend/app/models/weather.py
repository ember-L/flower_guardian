# 天气模型
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class WeatherQuery(Base):
    """天气查询记录"""
    __tablename__ = "weather_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 可选，游客也能用
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(100))  # 地点名称
    temp = Column(Integer)  # 温度
    temp_max = Column(Integer)  # 最高温度
    temp_min = Column(Integer)  # 最低温度
    humidity = Column(Integer)  # 湿度
    condition = Column(String(50))  # 天气状况
    air_quality = Column(String(20))  # 空气质量
    uv_index = Column(Integer)  # 紫外线指数
    wind_speed = Column(String(20))  # 风速
    tip = Column(Text)  # AI生成的小贴士
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weather_queries")
