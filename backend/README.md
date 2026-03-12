# 🐍 Backend - FastAPI 后端服务

护花使者后端服务，采用 FastAPI 框架开发，提供 RESTful API 接口。

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)

## 🚀 快速开始

### 环境要求

- Python 3.11+
- PostgreSQL 15+
- (可选) CUDA 11.8+ (用于 GPU 加速)

### 安装依赖

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt
```

### 运行服务

```bash
# 开发模式 (热重载)
uvicorn app.main:app --host 0.0.0.0 --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker 部署

```bash
# 构建镜像
docker build -t flower-guardian-backend .

# 运行容器
docker run -d -p 8000:8000 --name backend flower-guardian-backend
```

## 📁 项目结构

```
backend/
├── app/
│   ├── api/                    # API 路由
│   │   ├── endpoints/        # 端点定义
│   │   │   ├── users.py      # 👤 用户认证
│   │   │   ├── plants.py     # 🌱 植物管理
│   │   │   ├── recommend.py  # ✨ 智能推荐
│   │   │   ├── recognition.py # 🔍 植物识别
│   │   │   ├── diagnosis.py  # 🦟 病虫害诊断
│   │   │   ├── diaries.py   # 📖 日记
│   │   │   ├── reminders.py  # ⏰ 提醒
│   │   │   ├── products.py   # 🛍️ 商品
│   │   │   ├── orders.py     # 📦 订单
│   │   │   └── ...
│   │   └── router.py         # 路由聚合
│   ├── core/                 # 核心配置
│   │   ├── config.py        # 应用配置
│   │   ├── database.py     # 数据库连接
│   │   └── security.py     # 安全认证
│   ├── db/                   # 数据库
│   │   ├── base.py         # 基础模型
│   │   └── seed_plants.py  # 🌿 植物种子数据
│   ├── models/                # SQLAlchemy 模型
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── diary.py
│   │   └── ...
│   ├── schemas/               # Pydantic 模型
│   │   ├── user.py
│   │   ├── plant.py
│   │   └── ...
│   └── services/              # 业务逻辑
│       ├── recognition.py    # 🤖 YOLO 识别
│       └── ...
├── models/                    # AI 模型文件
│   ├── plant/               # 🌿 植物识别模型
│   └── pest/                # 🐛 病虫害模型
├── train/                    # 模型训练
│   ├── train_plant.py
│   ├── train_pest.py
│   └── export_onnx.py
├── dataset/                   # 数据集
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| ⚡ FastAPI | Web 框架 |
| 🐘 SQLAlchemy 2.0 | ORM |
| 📊 PostgreSQL | 数据库 |
| 🔒 Pydantic | 数据验证 |
| 🔑 JWT | 用户认证 |
| 🧠 PyTorch | 深度学习 |
| 🎯 Ultralytics YOLO | CV 推理 |

## 📡 API 接口概览

### 认证系统
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/users/register` | POST | 用户注册 |
| `/api/users/login` | POST | 用户登录 |
| `/api/users/me` | GET | 获取当前用户 |

### 植物模块
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/plants` | GET | 获取植物列表 |
| `/api/plants/{id}` | GET | 获取植物详情 |
| `/api/plants/my` | GET/POST | 我的植物 |
| `/api/recommend` | POST | 智能推荐 |

### AI 识别
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/recognition/plant` | POST | 植物识别 |
| `/api/diagnosis/pest` | POST | 病虫害诊断 |

### 商城模块
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/products` | GET | 商品列表 |
| `/api/cart` | GET/POST | 购物车 |
| `/api/orders` | GET/POST | 订单管理 |

## 🤖 AI 模型

### 植物识别模型

支持识别 **47 种**植物：

```
绿萝、虎皮兰、龟背竹、发财树、芦荟、
吊兰、文竹、橡皮树、君子兰、兰花...
```

### 病虫害诊断模型

识别常见病虫害及生理性疾病。

### 模型下载

```bash
python -m models.download_models
```

### 模型导出

```bash
# 导出为 ONNX 格式
python train/export_onnx.py --type all
```

## 🔧 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `SECRET_KEY` | JWT 密钥 | `your-secret-key` |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 | `30` |

## 🧪 测试

```bash
# 运行测试
pytest tests/

# 带覆盖率
pytest --cov=app tests/
```

## 📝 管理员设置

```python
# 创建管理员用户
from app.core.database import get_db
from app.models.user import User

db = next(get_db())
user = db.query(User).filter(User.username == "admin").first()
user.role = "admin"
db.commit()
```

## 🔌 集成移动端

移动端连接后端时，需要修改 API 地址：

```typescript
// APP/src/services/config.ts
export const API_BASE_URL = 'http://192.168.1.100:8000';
```

- 🍎 iOS 模拟器: 使用 Mac 局域网 IP
- 🍎 iOS 真机: 使用后端服务器实际 IP
- 🤖 Android 模拟器: 使用 `10.0.2.2` 访问主机
- 🤖 Android 真机: 使用后端服务器实际 IP

## 📄 许可证

MIT License

---

<p align="center">
  🚀 护花使者后端服务 - Powered by FastAPI 🚀
</p>
