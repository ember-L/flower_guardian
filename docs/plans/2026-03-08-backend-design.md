# 后端架构设计 - 护花使者

**日期:** 2026-03-08

## 1. 技术栈

| 组件 | 技术选择 |
|------|----------|
| 框架 | FastAPI |
| 数据库 | PostgreSQL |
| ORM | SQLAlchemy + Pydantic |
| 图像识别 | YOLOv11 (本地加载) |
| 认证 | JWT |

## 2. 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── recognition.py  # 花卉识别
│   │   │   ├── diagnosis.py   # 病症诊断
│   │   │   ├── plants.py      # 植物百科
│   │   │   ├── users.py       # 用户管理
│   │   │   └── reminders.py   # 智能提醒
│   │   └── router.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # 配置
│   │   ├── security.py       # JWT/鉴权
│   │   └── database.py       # 数据库连接
│   ├── db/
│   │   ├── __init__.py
│   │   └── base.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # 用户模型
│   │   ├── plant.py          # 植物模型
│   │   ├── reminder.py       # 提醒模型
│   │   └── diary.py          # 日记模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── reminder.py
│   │   └── diary.py
│   └── services/
│       ├── __init__.py
│       ├── recognition.py    # 花卉识别服务
│       └── diagnosis.py      # 病症诊断服务
├── models/                   # YOLO模型权重文件
│   └── plant_model.pt
├── requirements.txt
├── .env.example
└── README.md
```

## 3. 核心API

### 3.1 花卉识别
- `POST /api/recognition` - 上传图片，返回植物识别结果

### 3.2 病症诊断
- `POST /api/diagnosis` - 上传病害图片，返回诊断结果

### 3.3 植物百科
- `GET /api/plants` - 获取植物列表（支持筛选）
- `GET /api/plants/{id}` - 获取植物详情

### 3.4 用户管理
- `POST /api/users/register` - 注册
- `POST /api/users/login` - 登录
- `GET /api/users/me` - 获取当前用户

### 3.5 智能提醒
- `GET /api/reminders` - 获取用户提醒
- `POST /api/reminders` - 创建提醒
- `PUT /api/reminders/{id}` - 更新提醒

### 3.6 养花日记
- `GET /api/diaries` - 获取日记列表
- `POST /api/diaries` - 创建日记

## 4. 数据库设计

### 用户表 (users)
- id, username, email, password_hash, created_at

### 用户植物表 (user_plants)
- id, user_id, plant_name, plant_type, image_url, location, created_at

### 提醒表 (reminders)
- id, user_id, plant_id, type (water/fertilize/prune), interval_days, enabled, last_done, next_due

### 日记表 (diaries)
- id, user_id, plant_id, content, images, created_at

### 植物百科表 (plants)
- id, name, scientific_name, category, care_level, description, light_req, water_req

## 5. 图像识别流程

1. 接收上传的图片
2. 图片预处理（resize, normalize）
3. YOLOv11模型推理
4. 返回识别结果（置信度最高的类别）
5. 查询数据库返回植物详情

## 6. 安全配置

- JWT token认证
- 密码bcrypt加密
- CORS配置
- 请求限流
