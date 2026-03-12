from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.email_verification import EmailVerification, VerificationPurpose
from app.models.user import User
from app.schemas.email_verification import (
    SendVerificationCodeRequest,
    VerifyEmailRequest,
    ResetPasswordRequest
)
from app.services.email_service import generate_code, send_verification_email
from app.core.security import get_password_hash
from app.core.config import settings

router = APIRouter(prefix="/api/users", tags=["email_verification"])

# 验证码有效期配置
CODE_EXPIRE_MINUTES = {
    "register": 30,
    "password_reset": 15
}


@router.post("/send-verification-code")
def send_verification_code(request: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """发送邮箱验证码"""
    purpose = request.purpose

    # 生成验证码
    code = generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES.get(purpose, 30))

    # 保存验证码
    verification = EmailVerification(
        email=request.email,
        code=code,
        purpose=VerificationPurpose(purpose),
        expires_at=expires_at
    )

    # 如果是注册，验证邮箱是否已被使用
    if purpose == "register":
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    db.add(verification)
    db.commit()

    # 发送邮件
    send_verification_email(request.email, code, purpose)

    return {"message": "Verification code sent"}


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """验证邮箱验证码"""
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.code == request.code,
        EmailVerification.purpose == VerificationPurpose.REGISTER,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()

    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    # 更新用户邮箱验证状态
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        user.is_email_verified = True
        user.verification_code = None
        user.verification_code_expires = None

    verification.used = 1
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """使用验证码重置密码"""
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.code == request.code,
        EmailVerification.purpose == VerificationPurpose.PASSWORD_RESET,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()

    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    # 更新密码
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        user.password_hash = get_password_hash(request.new_password)

    verification.used = 1
    db.commit()

    return {"message": "Password reset successfully"}


@router.post("/forgot-password")
def forgot_password(request: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """发送密码重置验证码"""
    # 验证邮箱是否存在
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    # 设置为密码重置
    request.purpose = "password_reset"

    # 生成验证码
    code = generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES["password_reset"])

    # 保存验证码
    verification = EmailVerification(
        email=request.email,
        code=code,
        purpose=VerificationPurpose.PASSWORD_RESET,
        expires_at=expires_at
    )

    db.add(verification)
    db.commit()

    # 发送邮件
    send_verification_email(request.email, code, "password_reset")

    return {"message": "Verification code sent"}
