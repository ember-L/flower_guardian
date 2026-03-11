from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from pydantic import BaseModel


router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])


def get_current_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class OverviewResponse(BaseModel):
    total_sales: float
    order_count: int
    avg_order_value: float
    user_count: int


class TrendItem(BaseModel):
    date: str
    sales: float
    orders: int


class TrendResponse(BaseModel):
    labels: list
    sales: list
    orders: list


class ProductStatItem(BaseModel):
    product_id: int
    product_name: str
    sales_count: int
    sales_amount: float


class ProductsResponse(BaseModel):
    items: list


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    orders = query.all()
    total_sales = sum(float(o.total_amount) for o in orders)
    order_count = len(orders)
    avg_order_value = total_sales / order_count if order_count > 0 else 0

    # 新增用户数
    user_query = db.query(User)
    if start_date:
        user_query = user_query.filter(User.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        user_query = user_query.filter(User.created_at <= datetime.fromisoformat(end_date))
    user_count = user_query.count()

    return OverviewResponse(
        total_sales=total_sales,
        order_count=order_count,
        avg_order_value=avg_order_value,
        user_count=user_count
    )


@router.get("/trend", response_model=TrendResponse)
def get_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    orders = query.all()

    # 按日期分组
    trend_dict = {}
    for order in orders:
        if group_by == "day":
            key = order.created_at.strftime("%Y-%m-%d")
        elif group_by == "week":
            key = order.created_at.strftime("%Y-W%W")
        else:  # month
            key = order.created_at.strftime("%Y-%m")

        if key not in trend_dict:
            trend_dict[key] = {"sales": 0, "orders": 0}
        trend_dict[key]["sales"] += float(order.total_amount)
        trend_dict[key]["orders"] += 1

    # 排序
    sorted_keys = sorted(trend_dict.keys())

    return TrendResponse(
        labels=sorted_keys,
        sales=[trend_dict[k]["sales"] for k in sorted_keys],
        orders=[trend_dict[k]["orders"] for k in sorted_keys]
    )


@router.get("/products", response_model=ProductsResponse)
def get_product_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    # 查询订单项
    query = db.query(
        OrderItem.product_id,
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("sales_count"),
        func.sum(OrderItem.subtotal).label("sales_amount")
    ).join(Order).filter(Order.status.in_(["completed", "shipped"]))

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(end_date))

    results = query.group_by(OrderItem.product_id, OrderItem.product_name).order_by(
        func.sum(OrderItem.quantity).desc()
    ).limit(limit).all()

    items = [
        ProductStatItem(
            product_id=r.product_id,
            product_name=r.product_name,
            sales_count=r.sales_count or 0,
            sales_amount=float(r.sales_amount or 0)
        )
        for r in results
    ]

    return ProductsResponse(items=items)
