from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse

router = APIRouter(prefix="/api/addresses", tags=["addresses"])


@router.get("", response_model=List[AddressResponse])
def list_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户地址列表"""
    addresses = db.query(Address).filter(Address.user_id == current_user.id).all()
    return addresses


@router.post("", response_model=AddressResponse)
def create_address(
    address: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """添加新地址"""
    # 如果设为默认地址，先取消其他默认地址
    if address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True
        ).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        name=address.name,
        phone=address.phone,
        province=address.province,
        city=address.city,
        district=address.district,
        detail_address=address.detail_address,
        is_default=address.is_default
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    address_update: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # 如果设为默认地址，先取消其他默认地址
    if address_update.is_default and not address.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.is_default == True,
            Address.id != address_id
        ).update({"is_default": False})

    update_data = address_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    db.delete(address)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.put("/{address_id}/set-default", response_model=AddressResponse)
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """设置默认地址"""
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # 取消其他默认地址
    db.query(Address).filter(
        Address.user_id == current_user.id,
        Address.is_default == True
    ).update({"is_default": False})

    address.is_default = True
    db.commit()
    db.refresh(address)
    return address
