from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: str
    price: str
    quantity: int
    stock: int
    subtotal: str

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_amount: str
    item_count: int
