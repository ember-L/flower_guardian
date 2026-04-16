# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**护花使者 (Flower Guardian)** is a plant care management mobile app with AI-powered plant/pest recognition. The project consists of four main components:

- **weixin/**: UniApp/WeChat mini-program mobile app (active development)
- **APP/**: React Native mobile app (legacy)
- **backend/**: FastAPI Python backend with PostgreSQL
- **web/**: Next.js admin dashboard

## Development Commands

### Backend (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server (hot reload)
uvicorn app.main:app --reload --port 8000

# Run with Docker
docker-compose up -d
```

### Mobile App - WeChat/UniApp (weixin/)
```bash
cd weixin

# Install dependencies
npm install

# Development (UniApp uses its own CLI)
# See weixin/package.json for available scripts
```

### Mobile App - React Native (APP/) [Legacy]
```bash
cd APP

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android
npm run android
```

### Web Admin (Next.js)
```bash
cd web

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

### Docker Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Services run at:
# - Backend API: http://localhost:8000
# - Web: http://localhost:3000/admin
# - PostgreSQL: localhost:5555
```

## Architecture

### Backend (FastAPI)
```
backend/app/
├── api/endpoints/     # API route handlers
│   ├── users.py       # Authentication, user management
│   ├── plants.py      # Plant library management
│   ├── reminders.py   # Care reminders
│   ├── diaries.py     # Plant journals
│   ├── recognition.py # Plant CV inference
│   ├── diagnosis.py  # Pest diagnosis
│   ├── products.py   # E-commerce products
│   ├── orders.py     # Order management
│   ├── cart.py       # Shopping cart
│   ├── payments.py   # Payment processing
│   ├── chat.py       # AI conversation
│   ├── ai_chat.py    # AI plant doctor (DashScope)
│   ├── weather.py     # Weather API integration
│   └── admin_*/      # Admin endpoints
├── core/             # Config, DB, security
├── models/           # SQLAlchemy ORM models
├── schemas/          # Pydantic request/response models
├── services/         # Business logic, CV inference, AI
└── tasks/            # APScheduler scheduled tasks
```

### Mobile App (weixin/UniApp)
```
weixin/src/
├── pages/            # Page components
├── components/       # Reusable UI components (Icon, CustomTabBar)
├── services/        # API client (Taro request wrapper)
├── data/            # Static data (plantClasses)
└── types/           # TypeScript type definitions
```

### Web Admin (Next.js)
```
web/src/app/admin/
├── login/           # Admin authentication
├── dashboard/      # Overview stats
├── plants/         # Plant management
├── products/       # Product catalog
├── orders/         # Order management
└── users/          # User management
```

## Key Backend Components

### Database
- **PostgreSQL** runs on localhost:5555 (mapped from 5432)
- **Credentials**: `flower_user:flower_password@localhost:5555/flower_guardian`
- Models in `backend/app/models/` use SQLAlchemy
- Schemas in `backend/app/schemas/` use Pydantic
- Database migrations: add columns via raw SQL if needed

### AI Services
- **DashScope API** (阿里云): Used for AI plant doctor conversations via `ai_chat.py`
- **Dual YOLO Models**: Plant recognition + pest/disease recognition in `backend/models/`
- Models loaded on startup via `app/services/recognition.py` and `app/services/pest_recognition.py`

### Scheduled Tasks (APScheduler)
Located in `backend/app/tasks/`:
- `reminder_tasks.py`: Daily reminders (09:00), overdue reminders (every 3 hours), weather refresh (every 6 hours)
- Test push: `python -c "from app.tasks.reminder_tasks import test_push; import asyncio; asyncio.run(test_push(user_id=1))"`

### Authentication
- JWT-based authentication
- Admin role must be set manually in database: `UPDATE users SET role='admin' WHERE email='admin@example.com'`

## Mobile App Key Patterns

### WeChat/UniApp (weixin/)
- Uses Taro request wrapper for API calls (`weixin/src/services/request.ts`)
- Custom Icon component with IconPark icons (`weixin/src/components/Icon/`)
- Custom tab bar implementation (`weixin/src/components/CustomTabBar/`)
- State-based routing (no React Navigation stack)

### API Services
- Services use Taro request wrapper with auth interceptors
- Auth token stored via storage

### Icon System
- IconPark icons stored in `weixin/src/components/Icon/iconPaths.ts`
- Custom emoji additions in `weixin/src/components/Icon/ionicons.ts`
- Icon component in `weixin/src/components/Icon/index.tsx`

## CV Model Architecture

Dual YOLO models for AI recognition:
- **Plant Recognition**: Identifies 30+ indoor plants, flowers, vegetables
- **Pest/Disease Recognition**: Identifies pests, diseases, physiological disorders

Models are stored in `backend/models/` (PyTorch .pt and ONNX formats).

## Key API Endpoints

### Core
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/plants/my` - Add user plant
- `GET /api/plants/my` - Get user's plants
- `POST /api/recognition/plant` - Plant image recognition
- `POST /api/diagnosis/full` - Pest/disease diagnosis

### AI & Chat
- `POST /api/ai/chat` - AI plant doctor (DashScope)
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/{id}` - Get conversation with messages
- `POST /api/chat/conversations/{id}/messages` - Send message

### Reminders
- `GET /api/reminders` - Get user's reminders
- `POST /api/reminders` - Create reminder

### Products & Orders
- `GET /api/products` - Get product list
- `GET /api/cart` - Get shopping cart
- `POST /api/orders` - Create order

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection (postgresql://flower_user:flower_password@localhost:5555/flower_guardian) |
| SECRET_KEY | JWT signing key |
| DASHSCOPE_API_KEY | 阿里云 AI 对话 API Key |
| HEFENG_KEY | 和风天气 API Key |

### Mobile App
When connecting to backend from iOS Simulator/WeChat DevTools, use host machine's IP instead of localhost.
Config in `weixin/config/dev.js` and `weixin/config/prod.js`

## Common Tasks

### Database Schema Changes
When adding new columns to existing tables:
```python
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://flower_user:flower_password@localhost:5555/flower_guardian')
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);'))
    conn.commit()
```

### Testing Push Notifications
```bash
cd backend
python3 -c "from app.tasks.reminder_tasks import send_daily_reminders; import asyncio; asyncio.run(send_daily_reminders())"
```

### Mobile App Connect to Backend
Edit `weixin/config/dev.js`:
```javascript
API_BASE_URL: 'http://192.168.1.x:8000'
```

### Check Model Status
```bash
curl http://localhost:8000/models/status
```