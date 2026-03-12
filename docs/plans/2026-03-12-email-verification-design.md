# 邮箱验证功能设计方案

## 概述

实现用户注册时邮箱验证和找回密码功能，通过 SMTP 邮件服务发送验证码。

## 功能需求

1. **注册时验证邮箱** - 用户注册后需要验证邮箱才能登录
2. **找回密码** - 通过邮箱验证码重置密码

## 技术方案

### 1. 数据模型

**User 表修改** (`backend/app/models/user.py`)：
- 新增 `is_email_verified` (Boolean, 默认 false) - 邮箱是否已验证
- 新增 `verification_code` (String, 可空) - 当前待验证的验证码

**新增 EmailVerification 表** (`backend/app/models/email_verification.py`)：
- `id` - 主键
- `email` - 邮箱地址
- `code` - 6位验证码
- `purpose` - 用途 (register/password_reset)
- `expires_at` - 过期时间
- `created_at` - 创建时间

### 2. API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/users/send-verification-code` | POST | 发送邮箱验证码 |
| `/api/users/verify-email` | POST | 验证邮箱验证码 |
| `/api/users/forgot-password` | POST | 发送密码重置验证码 |
| `/api/users/reset-password` | POST | 使用验证码重置密码 |

### 3. 邮件服务

使用 `smtplib` 和 `email` 库发送邮件：

**配置项** (`.env`)：
```
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_email@qq.com
SMTP_PASSWORD=your_auth_code
SMTP_FROM=护花使者 <your_email@qq.com>
```

**邮件模板**：
- 注册验证邮件：包含6位验证码，30分钟有效期
- 密码重置邮件：包含6位验证码，15分钟有效期

### 4. 业务流程

**注册流程**：
1. 用户提交注册信息
2. 创建用户，`is_email_verified = false`
3. 生成验证码，发送到用户邮箱
4. 用户输入验证码，验证通过后 `is_email_verified = true`
5. 登录时检查 `is_email_verified`，未验证返回错误

**找回密码流程**：
1. 用户输入注册邮箱
2. 发送密码重置验证码到邮箱
3. 用户输入验证码和新密码
4. 验证通过后更新密码

### 5. 安全考虑

- 验证码 6 位数字
- 注册验证码 30 分钟有效期
- 密码重置验证码 15 分钟有效期
- 验证码错误 5 次后失效
- 同一邮箱 1 分钟内只能发送一次验证码

## 验收标准

1. 用户注册后收到验证邮件
2. 输入正确验证码后 `is_email_verified` 变为 true
3. 未验证邮箱的用户无法登录
4. 可以通过邮箱验证码重置密码
5. 验证码过期或错误时返回适当错误提示
