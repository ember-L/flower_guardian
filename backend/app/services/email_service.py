import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
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
    # QQ邮箱只使用邮箱地址
    msg['From'] = settings.SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html', 'utf-8'))

    try:
        print(f"Sending email to: {to_email}")
        print(f"SMTP User: {settings.SMTP_USER}")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_verification_email(email: str, code: str, purpose: str) -> bool:
    if purpose == "register":
        subject = "【护花使者】邮箱验证"
        body = f"""
        <html>
        <body>
            <h2 style="color: #4CAF50;">欢迎注册护花使者</h2>
            <p>您的邮箱验证码是：<strong style="font-size: 24px; color: #4CAF50;">{code}</strong></p>
            <p>验证码有效期为30分钟，请尽快完成验证。</p>
            <p style="color: #999;">如果不是您本人操作，请忽略此邮件。</p>
        </body>
        </html>
        """
    else:  # password_reset
        subject = "【护花使者】密码重置"
        body = f"""
        <html>
        <body>
            <h2 style="color: #FF9800;">密码重置验证码</h2>
            <p>您的验证码是：<strong style="font-size: 24px; color: #FF9800;">{code}</strong></p>
            <p>验证码有效期为15分钟，请尽快完成操作。</p>
            <p style="color: #999;">如果不是您本人操作，请忽略此邮件。</p>
        </body>
        </html>
        """

    return send_email(email, subject, body)
