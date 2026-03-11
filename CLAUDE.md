# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**护花使者 (Flower Guardian)** is a plant care management mobile app with AI-powered plant/pest recognition. The project consists of three main components:

- **APP/**: React Native mobile app (iOS/Android)
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

### Mobile App (React Native)
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
│   ├── users.py       # Authentication
│   ├── plants.py      # Plant management
│   ├── reminders.py   # Care reminders
│   ├── diaries.py     # Plant journals
│   ├── recognition.py # Plant CV inference
│   ├── diagnosis.py  # Pest diagnosis
│   ├── products.py   # E-commerce products
│   ├── orders.py     # Order management
│   └── admin_*/      # Admin endpoints
├── core/             # Config, DB, security
├── models/           # SQLAlchemy ORM models
├── schemas/          # Pydantic request/response models
└── services/         # Business logic, CV inference
```

### Mobile App (React Native)
```
APP/src/
├── screens/          # Screen components
├── components/       # Reusable UI components
├── navigation/       # React Navigation setup
├── services/        # API client (Axios)
└── contexts/        # React Context providers
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

## CV Model Architecture

Dual YOLO models for AI recognition:
- **Plant Recognition**: Identifies 30+ indoor plants, flowers, vegetables
- **Pest/Disease Recognition**: Identifies pests, diseases, physiological disorders

Models are stored in `backend/models/` (PyTorch .pt and ONNX formats).

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| SECRET_KEY | JWT signing key | your-secret-key |
| ALGORITHM | JWT algorithm | HS256 |

### Mobile App
When connecting to backend from iOS Simulator, use host machine's IP instead of localhost.

## Key Patterns

- Backend uses SQLAlchemy 2.0 with async-first patterns
- Mobile app uses UI Kitten components + NativeWind (Tailwind)
- Web admin uses Tailwind CSS v4
- Authentication via JWT tokens
- Admin role set manually in database (update `user.role = "admin"`)
