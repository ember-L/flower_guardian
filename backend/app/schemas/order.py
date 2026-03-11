from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    product_name: str
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_type: str  # express, pickup
    delivery_address: Optional[str] = None
    contact_name: str
    contact_phone: str
    remark: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_type: Optional[str] = None
    delivery_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    remark: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    total_amount: Decimal
    status: str
    delivery_type: str
    delivery_address: Optional[str]
    contact_name: str
    contact_phone: str
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: List[OrderResponse]
