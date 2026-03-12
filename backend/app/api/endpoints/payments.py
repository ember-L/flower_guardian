from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == payment.order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 检查是否已有支付记录
    existing = db.query(Payment).filter(Payment.order_id == payment.order_id).first()
    if existing:
        return existing

    payment_record = Payment(
        order_id=payment.order_id,
        amount=order.total_amount,
        payment_method=payment.payment_method,
        status="pending"
    )
    db.add(payment_record)
    db.commit()
    db.refresh(payment_record)

    return payment_record


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return payment


@router.post("/{payment_id}/callback")
def payment_callback(
    payment_id: int,
    status: str,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """支付回调接口 (模拟)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = status
    if transaction_id:
        payment.transaction_id = transaction_id
    if status == "paid":
        payment.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)

    return payment
