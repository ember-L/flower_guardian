from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.cart import (
    CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse
)

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    items = []
    total_amount = 0

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        subtotal = float(product.price) * item.quantity
        total_amount += subtotal

        items.append(CartItemResponse(
            id=item.id,
            product_id=product.id,
            product_name=product.name,
            product_image=product.image_url or '',
            price=str(product.price),
            quantity=item.quantity,
            stock=product.stock,
            subtotal=f"{subtotal:.2f}"
        ))

    return CartResponse(
        items=items,
        total_amount=f"{total_amount:.2f}",
        item_count=len(items)
    )


@router.post("/items", response_model=CartItemResponse)
def add_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != "active":
        raise HTTPException(status_code=400, detail="Product not available")

    # 检查是否已存在
    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item.product_id
    ).first()

    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
    else:
        existing = CartItem(
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)

    subtotal = float(product.price) * existing.quantity
    return CartItemResponse(
        id=existing.id,
        product_id=product.id,
        product_name=product.name,
        product_image=product.image_url or '',
        price=str(product.price),
        quantity=existing.quantity,
        stock=product.stock,
        subtotal=f"{subtotal:.2f}"
    )


@router.put("/items/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    item_update: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if item_update.quantity > product.stock:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart_item.quantity = item_update.quantity
    db.commit()
    db.refresh(cart_item)

    subtotal = float(product.price) * cart_item.quantity
    return CartItemResponse(
        id=cart_item.id,
        product_id=product.id,
        product_name=product.name,
        product_image=product.image_url or '',
        price=str(product.price),
        quantity=cart_item.quantity,
        stock=product.stock,
        subtotal=f"{subtotal:.2f}"
    )


@router.delete("/items/{item_id}")
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}


@router.delete("/clear")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}
