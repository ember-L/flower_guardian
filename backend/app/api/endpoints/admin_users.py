from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


def get_current_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class UserWithOrdersResponse:
    pass


from pydantic import BaseModel


class UserWithOrdersResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: str
    created_at: datetime
    orders: list = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    total: int
    items: list


@router.get("", response_model=UserListResponse)
def list_users(
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/{user_id}", response_model=UserWithOrdersResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()

    return UserWithOrdersResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role,
        created_at=user.created_at,
        orders=orders
    )


@router.get("/{user_id}/orders")
def get_user_orders(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    from app.schemas.order import OrderListResponse
    query = db.query(Order).filter(Order.user_id == user_id)
    total = query.count()
    items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}
