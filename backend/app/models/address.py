from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(50), nullable=False)  # 收货人姓名
    phone = Column(String(20), nullable=False)  # 联系电话
    province = Column(String(50))  # 省份
    city = Column(String(50))  # 城市
    district = Column(String(50))  # 区/县
    detail_address = Column(String(255), nullable=False)  # 详细地址
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="addresses")
