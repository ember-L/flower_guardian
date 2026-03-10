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
| 前端 | React Native (移动端) + Web |
| CV模型 | YOLOv11 (双模型：植物识别 + 病虫害识别) |
| 模型部署 | ONNX Runtime (服务器端 + 边缘端) |
| AI大模型 | Qwen API |
| 部署 | Docker Compose |

## CV 模型架构

项目采用**双 YOLO 模型架构**：

| 模型 | 功能 | 支持类别 |
|------|------|----------|
| 植物识别模型 | 识别常见室内植物、花卉、蔬菜 | 30+ 类别 |
| 病虫害识别模型 | 识别病虫害、生理性病害 | 昆虫、病害、生理障碍 |

详细技术文档见：[CV 模型使用指南](docs/plans/2026-03-10-cv-model-usage-guide.md)

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

## 项目结构

```
Flower_Guardian/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 端点
│   │   │   └── endpoints/ # 用户、植物、提醒、日记、识别、诊断
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
│   │   ├── config.py      # 训练配置
│   │   ├── train_plant.py # 植物模型训练
│   │   ├── train_pest.py # 病虫害模型训练
│   │   └── export_onnx.py # 模型导出
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # React Native 前端
│   ├── android/          # Android 配置
│   ├── ios/              # iOS 配置
│   ├── src/              # 源代码
│   │   ├── services/    # 识别服务（本地+服务端）
│   │   └── screens/     # 页面组件
│   ├── app.json
│   └── ...
├── docs/                   # 文档
│   └── plans/            # 技术规划文档
│       └── cv-model-usage-guide.md  # CV模型使用指南
├── docker-compose.yml     # Docker 部署配置
└── design.md             # 设计文档
```

## 快速开始

### 环境要求

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ (本地开发)

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
- 前端 Web: http://localhost:80
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
uvicorn app.main:app --reload
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm start
```

## API 端点

### 用户认证
| 端点 | 描述 |
|------|------|
| `POST /api/users/register` | 用户注册 |
| `POST /api/users/login` | 用户登录 |
| `GET /api/users/me` | 获取当前用户 |
| `PUT /api/users/me` | 更新用户信息 |
| `POST /api/users/password` | 修改密码 |

### 植物管理
| 端点 | 描述 |
|------|------|
| `GET /api/plants` | 获取植物列表 |
| `GET /api/plants/{id}` | 获取植物详情 |
| `GET /api/plants/my` | 获取我的植物 |
| `POST /api/plants/my` | 添加我的植物 |
| `DELETE /api/plants/my/{id}` | 删除我的植物 |

### 智能提醒
| 端点 | 描述 |
|------|------|
| `GET /api/reminders` | 获取提醒列表 |
| `POST /api/reminders` | 创建提醒 |
| `PUT /api/reminders/{id}` | 更新提醒 |
| `DELETE /api/reminders/{id}` | 删除提醒 |

### 图像识别（CV模型）
| 端点 | 描述 |
|------|------|
| `POST /api/recognition/plant` | 植物识别 |
| `POST /api/recognition/full` | 完整识别（植物+病虫害） |
| `POST /api/diagnosis/pest` | 病虫害识别 |
| `POST /api/diagnosis/full` | 完整诊断（含建议） |

### 养花日记
| 端点 | 描述 |
|------|------|
| `GET /api/diaries` | 获取日记列表 |
| `POST /api/diaries` | 创建日记 |
| `PUT /api/diaries/{id}` | 更新日记 |
| `DELETE /api/diaries/{id}` | 删除日记 |

## 环境变量

后端环境变量：

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `SECRET_KEY` | JWT 密钥 | your-secret-key |
| `ALGORITHM` | JWT 算法 | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 | 30 |

## CV 模型使用

### 模型训练

```bash
# 训练植物识别模型
python backend/train/train_plant.py

# 训练病虫害识别模型
python backend/train/train_pest.py

# 自定义参数训练
python -c "
from train.train_plant import train_plant_model
from train.config import TrainConfig

config = TrainConfig()
config.epochs = 50
config.model_type = 'yolo11s'
train_plant_model()
"
```

### 模型导出

```bash
# 导出为 ONNX 格式
python backend/train/export_onnx.py --type all

# 导出量化模型（更适合移动端）
python backend/train/export_onnx.py --type quantized
```

### 模型版本

| 模型 | 文件 | 说明 |
|------|------|------|
| 植物识别 | `plant_yolo11n.pt` | PyTorch 格式 |
| 植物识别 | `plant_yolo11n.onnx` | ONNX 格式 |
| 病虫害 | `pest_yolo11n.pt` | PyTorch 格式 |
| 病虫害 | `pest_yolo11n.onnx` | ONNX 格式 |

详细说明见：[CV 模型使用指南](docs/plans/2026-03-10-cv-model-usage-guide.md)

## 配色方案

- **主色调**: `#e94b52` (珊瑚红)
- **辅助色**: 清新绿 + 暖木色/米黄色

## License

MIT License
