# 邮箱验证功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现用户注册邮箱验证和密码找回功能，使用 QQ 邮箱 SMTP 发送验证码

**Architecture:** 在 FastAPI 后端添加邮箱验证模块，包括数据模型、邮件服务和 API 端点，修改登录流程验证邮箱状态

**Tech Stack:** FastAPI, SQLAlchemy, SMTP (QQ邮箱), Pydantic

---

## Task 1: 添加 SMTP 配置和环境变量

**Files:**
- Modify: `backend/.env`
- Modify: `backend/app/core/config.py`

**Step 1: 添加环境变量到 .env**

```bash
# 添加到 backend/.env 文件末尾
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_email@qq.com
SMTP_PASSWORD=your_auth_code
SMTP_FROM=护花使者 <your_email@qq.com>
```

**Step 2: 添加配置读取**

修改 `backend/app/core/config.py`，在 Settings 类中添加：
```python
SMTP_HOST: str = "smtp.qq.com"
SMTP_PORT: int = 587
SMTP_USER: str = ""
SMTP_PASSWORD: str = ""
SMTP_FROM: str = ""
```

---

## Task 2: 修改 User 模型添加邮箱验证字段

**Files:**
- Modify: `backend/app/models/user.py`

**Step 1: 添加字段**

在 User 模型中添加：
```python
is_email_verified = Column(Boolean, default=False)
verification_code = Column(String(6), nullable=True)
verification_code_expires = Column(DateTime, nullable=True)
```

---

## Task 3: 创建 EmailVerification 数据模型

**Files:**
- Create: `backend/app/models/email_verification.py`

**Step 1: 创建模型**

```python
from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
import enum
from app.db.base import Base

class VerificationPurpose(str, enum.Enum):
    REGISTER = "register"
    PASSWORD_RESET = "password_reset"

class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    purpose = Column(Enum(VerificationPurpose), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Integer, default=0)  # 已使用次数
```

**Step 2: 注册模型**

在 `backend/app/models/__init__.py` 中添加导入：
```python
from app.models.email_verification import EmailVerification, VerificationPurpose
```

---

## Task 4: 创建邮件服务

**Files:**
- Create: `backend/app/services/email_service.py`

**Step 1: 创建邮件服务**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import random
import string

def generate_code(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

def send_email(to_email: str, subject: str, body: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("SMTP not configured, skipping email send")
        return False

    msg = MIMEMultipart()
    msg['From'] = settings.SMTP_FROM or settings.SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html', 'utf-8'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_verification_email(email: str, code: str, purpose: str) -> bool:
    if purpose == "register":
        subject = "【护花使者】邮箱验证"
        body = f"""
        <h2>欢迎注册护花使者</h2>
        <p>您的邮箱验证码是：<strong style="font-size: 24px; color: #4CAF50;">{code}</strong></p>
        <p>验证码有效期为30分钟，请尽快完成验证。</p>
        <p>如果不是您本人操作，请忽略此邮件。</p>
        """
    else:  # password_reset
        subject = "【护花使者】密码重置"
        body = f"""
        <h2>密码重置验证码</h2>
        <p>您的验证码是：<strong style="font-size: 24px; color: #4CAF50;">{code}</strong></p>
        <p>验证码有效期为15分钟，请尽快完成操作。</p>
        <p>如果不是您本人操作，请忽略此邮件。</p>
        """

    return send_email(email, subject, body)
```

---

## Task 5: 创建邮箱验证 Schema

**Files:**
- Create: `backend/app/schemas/email_verification.py`

**Step 1: 创建 Schema**

```python
from pydantic import BaseModel, EmailStr

class SendVerificationCodeRequest(BaseModel):
    email: EmailStr
    purpose: str  # "register" or "password_reset"

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
```

---

## Task 6: 创建邮箱验证 API 端点

**Files:**
- Create: `backend/app/api/endpoints/email_verification.py`

**Step 1: 创建 API**

```python
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
    request.purpose = "password_reset"
    return send_verification_code(request, db)
```

---

## Task 7: 注册 API 端点到路由器

**Files:**
- Modify: `backend/app/api/router.py`

**Step 1: 添加路由**

```python
from app.api.endpoints import email_verification

router.include_router(email_verification.router)
```

---

## Task 8: 修改登录逻辑验证邮箱

**Files:**
- Modify: `backend/app/api/endpoints/users.py`

**Step 1: 修改登录函数**

在登录函数中添加邮箱验证检查：
```python
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查邮箱是否已验证
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified. Please verify your email first.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
```

**Step 2: 修改注册函数**

注册后自动发送验证邮件：
```python
@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # ... 现有代码 ...

    # 创建用户后发送验证邮件
    code = generate_code()
    new_user.verification_code = code
    new_user.verification_code_expires = datetime.utcnow() + timedelta(minutes=30)

    # 保存用户
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 发送验证邮件
    send_verification_email(new_user.email, code, "register")

    return new_user
```

---

## Task 9: 执行数据库迁移

**Step 1: 运行 Alembic 迁移**

```bash
cd backend
alembic revision --autogenerate -m "add email verification fields"
alembic upgrade head
```

---

## 验收标准

1. 用户注册后收到验证邮件
2. 输入正确验证码后 `is_email_verified` 变为 true
3. 未验证邮箱的用户无法登录
4. 可以通过邮箱验证码重置密码
5. 验证码过期或错误时返回适当错误提示
