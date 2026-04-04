# 护花使者 (Flower Guardian)

你的掌上植物管家，让养花不再凭感觉。

[![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green)](https://fastapi.tiangolo.com)
[![React Native](https://img.shields.io/badge/React-Native-0.74.6-blue)](https://reactnative.dev)

## 项目简介

护花使者是一款面向养花小白的智能植物管家应用。通过 AI 图像识别技术，帮助用户识别花卉、诊断病虫害，并提供科学的养护建议。

**Slogan**: 你的掌上植物管家，让养花不再凭感觉。

**目标用户**:
- 城市租房党、办公室白领（生活枯燥想养绿植，但没经验、没时间）
- 园艺爱好者、退休老人（侧重记录与分享）

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + PostgreSQL |
| 管理后台 | Next.js 14 + Tailwind CSS |
| 前端 | React Native (移动端) |
| CV模型 | YOLOv11 (双模型：植物识别 + 病虫害识别) |
| 模型部署 | ONNX Runtime (服务器端 + 边缘端) |
| AI大模型 | Qwen API |
| 部署 | Docker Compose |

## 核心功能

### 1. 花卉识别
- 拍照识别、相册导入
- 一键生成"档案卡"
- 相似种对比功能

### 2. 养护百科
- 傻瓜式养护卡片
- 养护难度分级
- 关键指标可视化
- 避坑指南

### 3. 智能提醒
- 浇水、施肥、换盆、修剪提醒
- 环境校准（根据摆放位置自动调整浇水频率）
- 懒人模式（自动学习用户习惯）
- **推送通知**：多渠道推送（Expo Push / JPush / FCM / APNs）

### 4. 病症诊断
- 拍照识别病虫害
- AI 预诊初步判断
- 社区专家求助

### 5. 新手推荐
- 场景化问答推荐
- "养不死榜单"推荐

### 6. 养花日记
- 成长记录、打卡、分享
- 对比图功能
- 植物生命线生长曲线

### 7. 植物商城 (MVP)
- 商品浏览与购买
- 支持快递配送和到店自提
- 订单管理

## 项目结构

```
Flower_Guardian/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 端点
│   │   │   └── endpoints/ # 用户、植物、商品、订单、提醒、日记、识别、诊断
│   │   ├── core/          # 核心配置
│   │   ├── db/            # 数据库
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # Pydantic 模型
│   │   └── services/     # 业务逻辑（识别服务）
│   ├── dataset/           # 数据集处理
│   ├── models/            # 训练好的模型文件
│   │   ├── plant/        # 植物识别模型
│   │   └── pest/         # 病虫害识别模型
│   ├── train/             # 模型训练
│   ├── Dockerfile
│   └── requirements.txt
├── web/                    # Next.js 管理后台
├── APP/                   # React Native 移动端（详见 APP/README.md）
│   ├── ios/              # iOS 配置
│   ├── android/          # Android 配置
│   ├── src/              # 源代码
│   └── package.json
├── docs/                   # 文档
│   └── plans/            # 技术规划文档
├── docker-compose.yml     # Docker 部署配置
└── design.md             # 设计文档
```

## 快速开始

### 环境要求

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ (本地开发)
- Xcode (iOS 开发)
- Android Studio (Android 开发)

### 使用 Docker Compose 启动

```bash
# 克隆项目后，启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务启动后：
- 后端 API: http://localhost:8000
- 前端 Web: http://localhost:3000
- PostgreSQL: localhost:5432

### 本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 运行服务
uvicorn app.main:app --reload --port 8000
```

#### 移动端 APP（详见 [APP/README.md](APP/README.md)）

```bash
cd APP

# 安装依赖
npm install

# 开发调试
npm start              # 启动 Metro 开发服务器
npx expo start        # 或使用 Expo 启动

# 运行 APP
npx expo run-ios       # iOS
npx expo run-android   # Android

# 查看可用模拟器
xcrun simctl list devices available
```

#### 管理后台 (Web)

```bash
cd web

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

管理后台地址: http://localhost:3000/admin

## APP 打包

详细打包说明请查看 [APP/README.md](APP/README.md#-打包发布)

### 快速打包

```bash
cd APP

# Android 调试 APK（无需签名）
npx expo run:android

# Android 发布版 APK
npx expo run:android --variant release

# iOS（需要 Apple 开发者账号）
open ios/app.xcworkspace
# 在 Xcode 中配置签名后打包
```

### APP 连接后端配置

APP 需要连接后端 API，修改 `APP/src/services/config.ts`：

```typescript
export const API_BASE_URL = 'http://192.168.1.100:8000';
```

| 运行环境 | API 地址 |
|---------|----------|
| iOS 模拟器 | Mac 局域网 IP |
| iOS 真机 | 后端服务器实际 IP 或域名 |
| Android 模拟器 | `10.0.2.2` 访问主机 localhost |
| Android 真机 | 后端服务器实际 IP 或域名 |

## API 端点

### 用户认证
| 端点 | 描述 |
|------|------|
| `POST /api/users/register` | 用户注册 |
| `POST /api/users/login` | 用户登录 |
| `GET /api/users/me` | 获取当前用户 |
| `PUT /api/users/me` | 更新用户信息 |
| `POST /api/users/push-token` | 注册推送 Token |

### 植物管理
| 端点 | 描述 |
|------|------|
| `GET /api/plants` | 获取植物列表 |
| `GET /api/plants/{id}` | 获取植物详情 |
| `GET /api/plants/my` | 获取我的植物 |
| `POST /api/plants/my` | 添加我的植物 |
| `DELETE /api/plants/my/{id}` | 删除我的植物 |

### 智能推荐
| 端点 | 描述 |
|------|------|
| `POST /api/recommend` | 获取新手推荐 |

### 图像识别（CV模型）
| 端点 | 描述 |
|------|------|
| `POST /api/recognition/plant` | 植物识别 |
| `POST /api/recognition/full` | 完整识别（植物+病虫害） |
| `POST /api/diagnosis/pest` | 病虫害识别 |
| `POST /api/diagnosis/full` | 完整诊断（含建议） |

### AI对话与天气
| 端点 | 描述 |
|------|------|
| `POST /api/ai/chat` | AI 植物医生对话 |
| `POST /api/weather/tips` | 获取天气和AI小贴士 |

### 养花日记
| 端点 | 描述 |
|------|------|
| `GET /api/diaries` | 获取日记列表 |
| `POST /api/diaries` | 创建日记 |
| `PUT /api/diaries/{id}` | 更新日记 |
| `DELETE /api/diaries/{id}` | 删除日记 |

### 商品与订单
| 端点 | 描述 |
|------|------|
| `GET /api/products` | 获取商品列表 |
| `GET /api/cart` | 获取购物车 |
| `POST /api/cart/items` | 添加到购物车 |
| `POST /api/orders` | 创建订单 |
| `GET /api/orders` | 我的订单列表 |

## 环境变量

后端环境变量（位于 `backend/.env`）：

| 变量 | 描述 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@localhost:5555/flower_guardian` |
| `SECRET_KEY` | JWT 密钥 | `your-secret-key-change-this-in-production` |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 | `30` |
| `SMTP_HOST` | SMTP 服务器 | `smtp.qq.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | `your-email@qq.com` |
| `SMTP_PASSWORD` | SMTP 密码 | `your-smtp-password` |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API Key（AI对话） | `sk-xxxxxxxx` |
| `HEFENG_KEY` | 和风天气 API Key（首页天气） | `xxxxxxxx` |
| `JPUSH_APP_KEY` | 极光推送 App Key | `xxxxxxxx` |
| `JPUSH_MASTER_SECRET` | 极光推送 Master Secret | `xxxxxxxx` |

### API Key 申请

#### 1. 阿里云 DashScope（AI对话、问诊）
1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 在"API-KEY管理"创建 API Key
4. 将 Key 添加到 `.env` 文件：`DASHSCOPE_API_KEY=sk-xxx`

#### 2. 和风天气（首页天气小贴士）
1. 访问 https://dev.qweather.com/
2. 注册/登录
3. 创建应用获取 API Key
4. 将 Key 添加到 `.env` 文件：`HEFENG_KEY=xxx`

> **注意**：国内免费版 API 有调用次数限制，生产环境建议购买付费版

#### 3. 极光推送（JPush）

1. 访问 https://www.jiguang.cn/ 注册账号
2. 创建应用获取 App Key 和 Master Secret
3. 将凭证添加到 `.env` 文件

## 推送通知

### 推送方式

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| **Expo Push** | 直接向设备发送推送 | 主要方式 |
| **JPush** | 通过极光服务推送 | 备选方式 |
| **FCM** | Firebase Cloud Messaging | Android 设备 |
| **APNs** | Apple Push Notification | iOS 设备 |

### 推送时间

| 任务 | 执行时间 | 功能 |
|------|----------|------|
| `send_daily_reminders` | 每日 09:00 | 发送当天到期提醒 |
| `send_overdue_reminders` | 每3小时 | 发送已逾期提醒 |

### 推送消息示例

**每日提醒**:
```
标题: 🌱 养护提醒
内容: 您的植物："绿萝"需要浇水，"吊兰"需要施肥，快去看看吧！
```

**逾期提醒**:
```
标题: ⚠️ 提醒逾期
内容: 以下植物还未养护："绿萝"需要浇水，不要忘记哦！
```

### 手动测试推送

```bash
cd backend

# 发送每日提醒
python3 -c "from app.tasks.reminder_tasks import send_daily_reminders; import asyncio; asyncio.run(send_daily_reminders())"

# 发送逾期提醒
python3 -c "from app.tasks.reminder_tasks import send_overdue_reminders; import asyncio; asyncio.run(send_overdue_reminders())"

# SSE 测试推送（需要用户已连接 SSE）
python3 -c "from app.tasks.reminder_tasks import test_sse_push; import asyncio; asyncio.run(test_sse_push(user_id=2))"

# 查看当前连接状态
python3 -c "from app.tasks.reminder_tasks import test_all_connections; import asyncio; asyncio.run(test_all_connections())"
```

> **注意**：
> - 推送需要用户已登录 App
> - SSE 推送需要 APP 在前台运行并保持连接

## 管理员设置

要创建管理员用户，需要将用户的 `role` 字段设置为 `admin`：

```python
# 在数据库中手动更新
from app.core.database import get_db
from app.models.user import User

db = next(get_db())
user = db.query(User).filter(User.username == "admin").first()
user.role = "admin"
db.commit()
```

## CV 模型架构

项目采用**双 YOLO 模型架构**：

| 模型 | 功能 | 支持类别 |
|------|------|----------|
| 植物识别模型 | 识别常见室内植物、花卉、蔬菜 | 47 类别 |
| 病虫害识别模型 | 识别病虫害、生理性病害 | 昆虫、病害、生理障碍 |

### 模型训练

```bash
# 训练植物识别模型
python backend/train/train_plant.py

# 训练病虫害识别模型
python backend/train/train_pest.py

# 导出为 ONNX 格式
python backend/train/export_onnx.py --type all
```

详细说明见：[CV 模型使用指南](docs/plans/2026-03-10-cv-model-usage-guide.md)

## 配色方案

- **主色调**: `#e94b52` (珊瑚红)
- **辅助色**: 清新绿 + 暖木色/米黄色

## 设计文档

- [推送通知功能设计](docs/push-notification-design.md)
- [新手推荐页面与植物百科完善设计](docs/plans/2026-03-12-recommendation-screen-design.md)
- [新手推荐页面实施计划](docs/plans/2026-03-12-recommendation-implementation.md)

## License

MIT License

---

*文档最后更新：2026-04-02*
