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
