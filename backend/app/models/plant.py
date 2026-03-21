from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    scientific_name = Column(String(150))
    category = Column(String(50))
    yolo_class_id = Column(Integer, unique=True, index=True)  # YOLO模型类别ID (0-46)
    care_level = Column(Integer, default=1)
    beginner_friendly = Column(Integer, default=3)  # 新手友好度 1-5
    description = Column(Text)
    light_requirement = Column(String(20))
    water_requirement = Column(String(20))
    watering_tip = Column(String(100))  # 浇水提示
    temperature_range = Column(String(50))
    humidity_range = Column(String(50))
    fertilization = Column(String(100))
    repotting = Column(String(100))
    common_mistakes = Column(Text)
    tips = Column(Text)
    is_toxic = Column(Boolean, default=False)  # 是否有毒
    features = Column(JSON)  # 特点标签: ["净化空气", "耐阴"]
    survival_rate = Column(Integer, default=90)  # 存活率
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间


class UserPlant(Base):
    __tablename__ = "user_plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plant_id = Column(Integer, ForeignKey("plants.id"))  # 关联基础植物表
    plant_name = Column(String(100), nullable=False)
    plant_type = Column(String(50))
    nickname = Column(String(50))  # 用户给植物起的名字
    image_url = Column(String(255))
    location = Column(String(50))
    acquired_from = Column(String(50), default="manual")  # 来源: recommendation/garden/manual
    notes = Column(Text)  # 备注
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_plants")
    plant = relationship("Plant")
    reminders = relationship("Reminder", back_populates="user_plant")
    diaries = relationship("Diary", back_populates="user_plant")
    care_records = relationship("CareRecord", back_populates="user_plant")
    growth_records = relationship("GrowthRecord", back_populates="user_plant")
    health_records = relationship("HealthRecord", back_populates="user_plant")
    plant_photos = relationship("PlantPhoto", back_populates="user_plant")


class CareRecord(Base):
    __tablename__ = "care_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    care_type = Column(String(50))  # 养护类型: watering/fertilizing/repotting/pruning/pest_control
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="care_records")


class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    record_date = Column(DateTime, default=datetime.utcnow)
    height = Column(Integer)  # 高度(cm)
    leaf_count = Column(Integer)  # 叶数
    flower_count = Column(Integer)  # 花苞数
    description = Column(String(255))  # 描述
    image_url = Column(String(255))  # 照片路径
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="growth_records")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    health_status = Column(String(20))  # health/good/fair/sick/critical
    pest_info = Column(String(255))  # 病虫害信息
    treatment = Column(String(255))  # 治疗措施
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="health_records")


class PlantPhoto(Base):
    __tablename__ = "plant_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    photo_url = Column(String(255))
    photo_type = Column(String(20))  # cover/growth/care
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plant = relationship("UserPlant", back_populates="plant_photos")
