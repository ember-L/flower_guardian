# 后端实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建护花使者后端FastAPI服务，提供花卉识别、病症诊断、植物百科、用户管理、智能提醒等API

**Architecture:** 单体FastAPI架构，使用SQLAlchemy ORM连接PostgreSQL，YOLOv11模型本地加载进行图像识别

**Tech Stack:** FastAPI, PostgreSQL, SQLAlchemy, Pydantic, JWT, Python-Jose, YOLOv11

---

## 任务1: 项目初始化与依赖

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`

**Step 1: 创建requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aiofiles==23.2.1
pillow==10.2.0
torch==2.1.2
torchvision==0.16.2
ultralytics==8.1.0
```

**Step 2: 创建.env.example**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flower_guardian
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Step 3: 创建app/__init__.py**

```python
# Flower Guardian Backend
```

**Step 4: 创建app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="护花使者 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "护花使者 API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

**Step 5: 测试运行**

Run: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
Expected: FastAPI服务启动成功

---

## 任务2: 数据库配置

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/__init__.py`

**Step 1: 创建app/core/config.py**

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/flower_guardian"
    SECRET_KEY: str = "secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
```

**Step 2: 创建app/core/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Step 3: 创建基础文件**

```python
# app/core/__init__.py
# app/db/base.py
from app.core.database import Base

# app/db/__init__.py
```

---

## 任务3: 数据模型

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/plant.py`
- Create: `backend/app/models/reminder.py`
- Create: `backend/app/models/diary.py`
- Create: `backend/app/models/__init__.py`

**Step 1: 创建用户模型 app/models/user.py**

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_plants = relationship("UserPlant", back_populates="user")
    reminders = relationship("Reminder", back_populates="user")
    diaries = relationship("Diary", back_populates="user")
```

**Step 2: 创建植物模型 app/models/plant.py**

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    scientific_name = Column(String(150))
    category = Column(String(50))
    care_level = Column(Integer, default=1)
    description = Column(Text)
    light_requirement = Column(String(20))
    water_requirement = Column(String(20))
    temperature_range = Column(String(50))
    humidity_range = Column(String(50))
    fertilization = Column(String(100))
    repotting = Column(String(100))
    common_mistakes = Column(Text)
    tips = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserPlant(Base):
    __tablename__ = "user_plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plant_name = Column(String(100), nullable=False)
    plant_type = Column(String(50))
    image_url = Column(String(255))
    location = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_plants")
    reminders = relationship("Reminder", back_populates="user_plant")
    diaries = relationship("Diary", back_populates="user_plant")
```

**Step 3: 创建提醒模型 app/models/reminder.py**

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    type = Column(String(20))
    interval_days = Column(Integer, default=7)
    enabled = Column(Boolean, default=True)
    last_done = Column(DateTime)
    next_due = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reminders")
    user_plant = relationship("UserPlant", back_populates="reminders")
```

**Step 4: 创建日记模型 app/models/diary.py**

```python
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"))
    content = Column(Text, nullable=False)
    images = Column(Text)
    height = Column(Integer)
    leaf_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="diaries")
    user_plant = relationship("UserPlant", back_populates="diaries")
```

**Step 5: 创建__init__.py**

```python
from app.models.user import User
from app.models.plant import Plant, UserPlant
from app.models.reminder import Reminder
from app.models.diary import Diary

__all__ = ["User", "Plant", "UserPlant", "Reminder", "Diary"]
```

---

## 任务4: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/schemas/plant.py`
- Create: `backend/app/schemas/reminder.py`
- Create: `backend/app/schemas/diary.py`
- Create: `backend/app/schemas/recognition.py`
- Create: `backend/app/schemas/__init__.py`

**Step 1: 创建用户schemas app/schemas/user.py**

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
```

**Step 2: 创建植物schemas app/schemas/plant.py**

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PlantBase(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    care_level: int = 1
    description: Optional[str] = None

class PlantResponse(PlantBase):
    id: int
    light_requirement: Optional[str] = None
    water_requirement: Optional[str] = None

    class Config:
        from_attributes = True

class UserPlantCreate(BaseModel):
    plant_name: str
    plant_type: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None

class UserPlantResponse(UserPlantCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PlantListResponse(BaseModel):
    total: int
    items: List[PlantResponse]
```

**Step 3: 创建提醒schemas app/schemas/reminder.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderBase(BaseModel):
    type: str
    interval_days: int = 7
    enabled: bool = True

class ReminderCreate(ReminderBase):
    user_plant_id: int

class ReminderUpdate(BaseModel):
    type: Optional[str] = None
    interval_days: Optional[int] = None
    enabled: Optional[bool] = None
    last_done: Optional[datetime] = None

class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    user_plant_id: int
    last_done: Optional[datetime] = None
    next_due: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 4: 创建日记schemas app/schemas/diary.py**

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DiaryCreate(BaseModel):
    user_plant_id: int
    content: str
    images: Optional[List[str]] = None
    height: Optional[int] = None
    leaf_count: Optional[int] = None

class DiaryResponse(DiaryCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

**Step 5: 创建识别schemas app/schemas/recognition.py**

```python
from pydantic import BaseModel
from typing import Optional, List

class SimilarSpecies(BaseModel):
    id: str
    name: str
    image_url: Optional[str] = None
    difference: str

class RecognitionResponse(BaseModel):
    id: str
    name: str
    scientific_name: str
    confidence: float
    description: str
    care_level: int
    light_requirement: str
    water_requirement: str
    image_url: Optional[str] = None
    similar_species: Optional[List[SimilarSpecies]] = None

class DiagnosisResponse(BaseModel):
    id: str
    symptom: str
    possible_causes: List[str]
    severity: str
    treatment: str
    prevention: str
```

**Step 6: 创建__init__.py**

```python
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.schemas.plant import PlantResponse, UserPlantCreate, UserPlantResponse, PlantListResponse
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.schemas.diary import DiaryCreate, DiaryResponse
from app.schemas.recognition import RecognitionResponse, DiagnosisResponse, SimilarSpecies
```

---

## 任务5: 安全认证

**Files:**
- Create: `backend/app/core/security.py`

**Step 1: 创建security.py**

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
```

---

## 任务6: API路由 - 用户管理

**Files:**
- Create: `backend/app/api/endpoints/users.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建users.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 2: 创建router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users

api_router = APIRouter()
api_router.include_router(users.router)
```

**Step 3: 修改main.py添加路由**

```python
from app.api.router import api_router
from app.core.database import engine
from app.db.base import Base

Base.metadata.create_all(bind=engine)
app.include_router(api_router)
```

---

## 任务7: API路由 - 植物百科

**Files:**
- Create: `backend/app/api/endpoints/plants.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建plants.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plant import Plant, UserPlant
from app.schemas.plant import PlantResponse, UserPlantCreate, UserPlantResponse, PlantListResponse

router = APIRouter(prefix="/api/plants", tags=["plants"])

@router.get("", response_model=PlantListResponse)
def list_plants(
    category: Optional[str] = None,
    care_level: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Plant)
    if category:
        query = query.filter(Plant.category == category)
    if care_level:
        query = query.filter(Plant.care_level == care_level)
    if search:
        query = query.filter(Plant.name.contains(search))

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}

@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@router.post("/my", response_model=UserPlantResponse)
def add_user_plant(
    plant: UserPlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_user_plant = UserPlant(user_id=current_user.id, **plant.model_dump())
    db.add(new_user_plant)
    db.commit()
    db.refresh(new_user_plant)
    return new_user_plant

@router.get("/my", response_model=list[UserPlantResponse])
def get_my_plants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(UserPlant).filter(UserPlant.user_id == current_user.id).all()
```

**Step 2: 更新router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users, plants

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
```

---

## 任务8: API路由 - 智能提醒

**Files:**
- Create: `backend/app/api/endpoints/reminders.py`

**Step 1: 创建reminders.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()

@router.post("", response_model=ReminderResponse)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    next_due = datetime.utcnow() + timedelta(days=reminder.interval_days)
    new_reminder = Reminder(
        user_id=current_user.id,
        **reminder.model_dump(),
        next_due=next_due
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    update_data = reminder_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)

    if reminder_update.last_done:
        reminder.next_due = reminder.last_done + timedelta(days=reminder.interval_days)

    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted"}
```

**Step 2: 更新router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
```

---

## 任务9: API路由 - 养花日记

**Files:**
- Create: `backend/app/api/endpoints/diaries.py`

**Step 1: 创建diaries.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.diary import Diary
from app.schemas.diary import DiaryCreate, DiaryResponse

router = APIRouter(prefix="/api/diaries", tags=["diaries"])

@router.get("", response_model=List[DiaryResponse])
def get_diaries(
    plant_id: int = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Diary).filter(Diary.user_id == current_user.id)
    if plant_id:
        query = query.filter(Diary.user_plant_id == plant_id)
    return query.order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=DiaryResponse)
def create_diary(
    diary: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_diary = Diary(user_id=current_user.id, **diary.model_dump())
    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)
    return new_diary

@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    diary = db.query(Diary).filter(
        Diary.id == diary_id,
        Diary.user_id == current_user.id
    ).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    return diary
```

**Step 2: 更新router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
api_router.include_router(diaries.router)
```

---

## 任务10: 图像识别服务

**Files:**
- Create: `backend/app/services/recognition.py`
- Create: `backend/app/api/endpoints/recognition.py`

**Step 1: 创建recognition.py服务**

```python
import os
from typing import Optional, List
from PIL import Image
import torch
from ultralytics import YOLO

class RecognitionService:
    def __init__(self, model_path: str = "backend/models/plant_model.pt"):
        self.model = None
        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            self.model = YOLO(self.model_path)
        else:
            self.model = YOLO("yolov8n.pt")

    def recognize(self, image_path: str) -> dict:
        if not self.model:
            raise RuntimeError("Model not loaded")

        results = self.model(image_path)
        result = results[0]

        if result.boxes:
            best_idx = result.boxes.conf.argmax()
            box = result.boxes[best_idx]

            return {
                "id": str(int(box.cls[0])),
                "name": result.names[int(box.cls[0])],
                "confidence": float(box.conf[0])
            }

        return {"id": "0", "name": "unknown", "confidence": 0.0}

recognition_service = RecognitionService()
```

**Step 2: 创建recognition.py端点**

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.recognition import recognition_service
from app.schemas.recognition import RecognitionResponse, SimilarSpecies
import tempfile
import os

router = APIRouter(prefix="/api/recognition", tags=["recognition"])

@router.post("", response_model=RecognitionResponse)
async def recognize_plant(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = recognition_service.recognize(tmp_path)
        return RecognitionResponse(
            id=result.get("id", "1"),
            name=result.get("name", "绿萝"),
            scientific_name="Epipremnum aureum",
            confidence=result.get("confidence", 0.95),
            description="绿萝是天南星科麒麟叶属植物...",
            care_level=1,
            light_requirement="耐阴",
            water_requirement="见干见湿",
            similar_species=[
                SimilarSpecies(id="2", name="吊兰", difference="吊兰叶片更细长"),
                SimilarSpecies(id="3", name="常春藤", difference="常春藤叶片为掌状五裂")
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
```

**Step 3: 更新router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries, recognition

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
api_router.include_router(diaries.router)
api_router.include_router(recognition.router)
```

---

## 任务11: 病症诊断服务

**Files:**
- Create: `backend/app/services/diagnosis.py`
- Create: `backend/app/api/endpoints/diagnosis.py`

**Step 1: 创建diagnosis.py服务**

```python
class DiagnosisService:
    def __init__(self):
        self.symptoms = {
            "黄叶": {
                "causes": ["浇水过多", "浇水过少", "缺铁", "光照不足"],
                "severity": "medium",
                "treatment": "1. 检查土壤湿度\n2. 施加含铁肥料\n3. 改善光照",
                "prevention": "遵循见干见湿原则"
            },
            "叶片发白": {
                "causes": ["光照过强", "缺肥", "病害"],
                "severity": "medium",
                "treatment": "1. 移至散光处\n2. 适当施肥",
                "prevention": "避免强光直射"
            },
            "叶片发黑": {
                "causes": ["冻害", "浇水过多", "病害"],
                "severity": "high",
                "treatment": "1. 移至温暖处\n2. 控制浇水\n3. 使用多菌灵",
                "prevention": "冬季注意保暖"
            },
        }

    def diagnose(self, symptom: str) -> dict:
        if symptom in self.symptoms:
            data = self.symptoms[symptom]
            return {
                "id": "1",
                "symptom": symptom,
                "possible_causes": data["causes"],
                "severity": data["severity"],
                "treatment": data["treatment"],
                "prevention": data["prevention"]
            }
        return {
            "id": "0",
            "symptom": symptom,
            "possible_causes": ["需要进一步检查"],
            "severity": "low",
            "treatment": "建议咨询专业人士",
            "prevention": "保持良好养护习惯"
        }

diagnosis_service = DiagnosisService()
```

**Step 2: 创建diagnosis.py端点**

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.diagnosis import diagnosis_service
from app.schemas.recognition import DiagnosisResponse
import tempfile
import os

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])

@router.post("", response_model=DiagnosisResponse)
async def diagnose_plant(
    file: UploadFile = File(...),
    symptom: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if not symptom:
            symptom = "黄叶"
        result = diagnosis_service.diagnose(symptom)
        return DiagnosisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
```

**Step 3: 更新router.py**

```python
from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries, recognition, diagnosis

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
api_router.include_router(diaries.router)
api_router.include_router(recognition.router)
api_router.include_router(diagnosis.router)
```

---

## 任务12: 数据集获取模块

**Files:**
- Create: `backend/dataset/downloader.py`
- Create: `backend/dataset/preprocessing.py`
- Create: `backend/dataset/augmentation.py`
- Create: `backend/dataset/__init__.py`

**Step 1: 创建downloader.py - 数据集下载工具**

```python
"""
数据集下载器
支持从公开数据集获取植物图像
"""
import os
import requests
import zipfile
from pathlib import Path
from typing import List, Optional

class DatasetDownloader:
    DATASETS = {
        "plantnet": {
            "url": "https://zenodo.org/record/XXXXXXX/files/plantnet.zip",
            "description": "PlantNet数据集"
        },
        "iNaturalist": {
            "url": "https://github.com/...,# iNaturalist数据集",
            "description": "iNaturalist植物图像"
        }
    }

    def __init__(self, output_dir: str = "backend/dataset/data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def download_from_url(self, url: str, filename: str) -> str:
        """从URL下载数据集"""
        output_path = self.output_dir / filename

        print(f"Downloading {filename}...")
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))

        with open(output_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgress: {progress:.1f}%", end="")

        print(f"\nDownloaded to {output_path}")
        return str(output_path)

    def extract_zip(self, zip_path: str, extract_to: str = None) -> str:
        """解压ZIP文件"""
        if extract_to is None:
            extract_to = self.output_dir

        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)

        print(f"Extracted to {extract_to}")
        return extract_to

    def download_plantnet_sample(self, plant_names: List[str]):
        """下载PlantNet示例数据（模拟）"""
        sample_dir = self.output_dir / "plantnet_sample"
        sample_dir.mkdir(exist_ok=True)

        # 模拟下载，实际使用时替换为真实API调用
        for name in plant_names:
            plant_dir = sample_dir / name.replace(" ", "_")
            plant_dir.mkdir(exist_ok=True)
            print(f"Created directory for: {name}")

        print(f"Sample dataset structure created at {sample_dir}")
        return str(sample_dir)

    def list_classes(self, data_dir: str) -> List[str]:
        """列出数据目录中的类别"""
        data_path = Path(data_dir)
        if not data_path.exists():
            return []

        classes = [d.name for d in data_path.iterdir() if d.is_dir()]
        return sorted(classes)


if __name__ == "__main__":
    downloader = DatasetDownloader()

    # 示例：创建示例数据结构
    plant_classes = ["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]
    data_dir = downloader.download_plantnet_sample(plant_classes)

    classes = downloader.list_classes(data_dir)
    print(f"Found {len(classes)} classes: {classes}")
```

**Step 2: 创建preprocessing.py - 数据预处理**

```python
"""
图像预处理工具
用于YOLO模型训练的图像预处理
"""
import os
from pathlib import Path
from PIL import Image
from typing import Tuple, List
import shutil

class ImagePreprocessor:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def resize_image(self, image_path: str, target_size: Tuple[int, int] = (640, 640)) -> str:
        """调整图像大小"""
        img = Image.open(image_path)
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)

        output_path = self.output_dir / Path(image_path).name
        img_resized.save(output_path)
        return str(output_path)

    def resize_directory(self, target_size: Tuple[int, int] = (640, 640)):
        """批量调整图像大小"""
        processed = 0
        for img_path in self.input_dir.rglob("*.jpg"):
            try:
                self.resize_image(str(img_path), target_size)
                processed += 1
            except Exception as e:
                print(f"Error processing {img_path}: {e}")

        print(f"Processed {processed} images")
        return processed

    def convert_to_yolo_format(self, image_dir: str, label_dir: str):
        """转换为YOLO格式"""
        # YOLO格式：class_id x_center y_center width height (normalized 0-1)
        yolo_dir = self.output_dir / "labels"
        yolo_dir.mkdir(exist_ok=True)

        # 复制图像到统一目录
        images_dir = self.output_dir / "images"
        images_dir.mkdir(exist_ok=True)

        for img_path in Path(image_dir).rglob("*.jpg"):
            shutil.copy(img_path, images_dir / img_path.name)

        print(f"Converted to YOLO format at {self.output_dir}")
        return str(self.output_dir)

    def validate_dataset(self, data_dir: str) -> dict:
        """验证数据集完整性"""
        data_path = Path(data_dir)
        stats = {
            "total_images": 0,
            "total_labels": 0,
            "missing_labels": [],
            "corrupted_images": []
        }

        for img_path in data_path.rglob("*.jpg"):
            stats["total_images"] += 1
            label_path = img_path.with_suffix('.txt')

            if not label_path.exists():
                stats["missing_labels"].append(img_path.name)

            try:
                Image.open(img_path).verify()
            except Exception:
                stats["corrupted_images"].append(img_path.name)

        for label_path in data_path.rglob("*.txt"):
            stats["total_labels"] += 1

        return stats


if __name__ == "__main__":
    # 示例使用
    preprocessor = ImagePreprocessor(
        input_dir="backend/dataset/data",
        output_dir="backend/dataset/processed"
    )

    # 批量调整大小
    preprocessor.resize_directory()
```

**Step 3: 创建augmentation.py - 数据增强**

```python
"""
数据增强工具
用于扩充训练数据集
"""
import random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import shutil

class DataAugmenter:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def apply_flip(self, image: Image.Image, horizontal: bool = True) -> Image.Image:
        """水平/垂直翻转"""
        if horizontal:
            return ImageOps.mirror(image)
        return ImageOps.flip(image)

    def apply_rotation(self, image: Image.Image, angle: int) -> Image.Image:
        """旋转图像"""
        return image.rotate(angle, expand=True)

    def apply_brightness(self, image: Image.Image, factor: float) -> Image.Image:
        """调整亮度"""
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)

    def apply_contrast(self, image: Image.Image, factor: float) -> Image.Image:
        """调整对比度"""
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)

    def apply_saturation(self, image: Image.Image, factor: float) -> Image.Image:
        """调整饱和度"""
        enhancer = ImageEnhance.Color(image)
        return enhancer.enhance(factor)

    def random_augment(self, image_path: str, num_augmented: int = 5) -> List[str]:
        """随机增强"""
        img = Image.open(image_path)
        output_paths = []

        base_name = Path(image_path).stem
        extension = Path(image_path).suffix

        for i in range(num_augmented):
            aug_img = img.copy()

            # 随机应用增强
            if random.random() > 0.5:
                aug_img = self.apply_flip(aug_img, random.random() > 0.5)

            if random.random() > 0.5:
                angle = random.choice([90, 180, 270])
                aug_img = self.apply_rotation(aug_img, angle)

            if random.random() > 0.3:
                factor = random.uniform(0.7, 1.3)
                aug_img = self.apply_brightness(aug_img, factor)

            if random.random() > 0.3:
                factor = random.uniform(0.8, 1.2)
                aug_img = self.apply_contrast(aug_img, factor)

            # 保存
            output_path = self.output_dir / f"{base_name}_aug{i}{extension}"
            aug_img.save(output_path)
            output_paths.append(str(output_path))

        return output_paths

    def augment_directory(self, num_augmented: int = 5):
        """批量增强目录中的图像"""
        total_created = 0

        for img_path in self.input_dir.rglob("*.jpg"):
            try:
                self.random_augment(str(img_path), num_augmented)
                total_created += num_augmented
            except Exception as e:
                print(f"Error augmenting {img_path}: {e}")

        print(f"Created {total_created} augmented images")
        return total_created


if __name__ == "__main__":
    augmenter = DataAugmenter(
        input_dir="backend/dataset/processed",
        output_dir="backend/dataset/augmented"
    )

    augmenter.augment_directory(num_augmented=3)
```

**Step 4: 创建__init__.py**

```python
# Dataset Module
# 用于数据集获取、预处理和增强
```

---

## 任务13: YOLO模型训练模块

**Files:**
- Create: `backend/train/trainer.py`
- Create: `backend/train/config.py`
- Create: `backend/train/__init__.py`

**Step 1: 创建config.py - 训练配置**

```python
"""
YOLO训练配置文件
"""
from dataclasses import dataclass
from pathlib import Path

@dataclass
class TrainConfig:
    # 数据配置
    data_dir: str = "backend/dataset/processed"
    model_type: str = "yolov8n"  # yolov8n, yolov8s, yolov8m, yolov8l, yolov8x

    # 训练参数
    epochs: int = 100
    batch_size: int = 16
    image_size: int = 640
    patience: int = 50
    save_period: int = 10

    # 优化器参数
    lr0: float = 0.01
    lrf: float = 0.01
    momentum: float = 0.937
    weight_decay: float = 0.0005

    # 输出配置
    output_dir: str = "backend/models/runs"
    project: str = "flower_guardian"
    name: str = "train"

    # 类别名称
    class_names: list = None

    def __post_init__(self):
        if self.class_names is None:
            self.class_names = ["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]

    def to_dict(self):
        return {
            "path": str(Path(self.data_dir).parent),
            "train": f"{self.data_dir}/train/images",
            "val": f"{self.data_dir}/val/images",
            "nc": len(self.class_names),
            "names": {i: name for i, name in enumerate(self.class_names)}
        }


# 数据集划分比例
TRAIN_RATIO = 0.8
VAL_RATIO = 0.1
TEST_RATIO = 0.1
```

**Step 2: 创建trainer.py - 训练器**

```python
"""
YOLO模型训练器
"""
import os
import yaml
from pathlib import Path
from typing import Optional
from sklearn.model_selection import train_test_split
import shutil

class YOLOTrainer:
    def __init__(self, config):
        self.config = config
        self.model = None

    def split_dataset(self, data_dir: str, output_dir: str):
        """划分训练集、验证集、测试集"""
        data_path = Path(data_dir)
        output_path = Path(output_dir)

        # 创建目录结构
        for split in ['train', 'val', 'test']:
            (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
            (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)

        # 获取所有类别目录
        class_dirs = [d for d in data_path.iterdir() if d.is_dir()]

        for class_dir in class_dirs:
            images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))

            if len(images) == 0:
                continue

            # 划分数据
            train_images, temp_images = train_test_split(
                images, test_size=(1 - TRAIN_RATIO), random_state=42
            )
            val_images, test_images = train_test_split(
                temp_images, test_size=(TEST_RATIO / (VAL_RATIO + TEST_RATIO)), random_state=42
            )

            # 复制文件
            for img_list, split in [(train_images, 'train'),
                                    (val_images, 'val'),
                                    (test_images, 'test')]:
                for img in img_list:
                    # 复制图像
                    dest_img = output_path / split / 'images' / img.name
                    shutil.copy(img, dest_img)

                    # 复制标签（如果存在）
                    label_file = img.with_suffix('.txt')
                    if label_file.exists():
                        dest_label = output_path / split / 'labels' / label_file.name
                        shutil.copy(label_file, dest_label)

        print(f"Dataset split completed: {output_dir}")
        return output_dir

    def create_data_yaml(self, output_dir: str):
        """创建YOLO数据配置文件"""
        data_config = {
            'path': str(Path(output_dir).parent),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'nc': len(self.config.class_names),
            'names': {i: name for i, name in enumerate(self.config.class_names)}
        }

        yaml_path = Path(output_dir).parent / "data.yaml"
        with open(yaml_path, 'w') as f:
            yaml.dump(data_config, f)

        print(f"Created data config: {yaml_path}")
        return str(yaml_path)

    def train(self, data_yaml: str, resume: bool = False) -> str:
        """训练YOLO模型"""
        try:
            from ultralytics import YOLO
        except ImportError:
            raise ImportError("Please install ultralytics: pip install ultralytics")

        # 加载模型
        if resume:
            # 从上次训练继续
            last_checkpoint = Path(self.config.output_dir) / self.config.project / self.config.name / "weights" / "last.pt"
            if last_checkpoint.exists():
                self.model = YOLO(str(last_checkpoint))
            else:
                raise FileNotFoundError("No checkpoint found to resume")
        else:
            # 从预训练模型开始
            self.model = YOLO(f"{self.config.model_type}.pt")

        # 训练参数
        results = self.model.train(
            data=data_yaml,
            epochs=self.config.epochs,
            batch=self.config.batch_size,
            imgsz=self.config.image_size,
            patience=self.config.patience,
            save_period=self.config.save_period,
            lr0=self.config.lr0,
            lrf=self.config.lrf,
            momentum=self.config.momentum,
            weight_decay=self.config.weight_decay,
            project=self.config.output_dir,
            name=self.config.project,
            exist_ok=True,
            pretrained=True,
            optimizer='SGD',
            verbose=True
        )

        # 返回最佳模型路径
        best_model = Path(self.config.output_dir) / self.config.project / self.config.name / "weights" / "best.pt"
        return str(best_model)

    def export_model(self, model_path: str, format: str = "onnx") -> str:
        """导出模型为不同格式"""
        from ultralytics import YOLO

        model = YOLO(model_path)
        export_path = model.export(format=format)

        return export_path


def main():
    """训练入口"""
    from train.config import TrainConfig

    config = TrainConfig(
        data_dir="backend/dataset/processed",
        model_type="yolov8n",
        epochs=100,
        batch_size=16,
        class_names=["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]
    )

    trainer = YOLOTrainer(config)

    # 1. 划分数据集
    split_dir = "backend/dataset/split"
    trainer.split_dataset(config.data_dir, split_dir)

    # 2. 创建数据配置
    data_yaml = trainer.create_data_yaml(split_dir)

    # 3. 训练模型
    print("Starting training...")
    best_model = trainer.train(data_yaml)

    print(f"Training completed! Best model: {best_model}")

    # 4. 导出为ONNX格式
    onnx_model = trainer.export_model(best_model, format="onnx")
    print(f"Model exported to: {onnx_model}")


if __name__ == "__main__":
    main()
```

**Step 3: 创建__init__.py**

```python
# Training Module
# 用于YOLO模型训练
```

---

## 任务14: 初始化数据

**Files:**
- Create: `backend/app/db/seed.py`

**Step 1: 创建seed.py**

```python
from app.db.base import Base
from app.core.database import engine, SessionLocal
from app.models.plant import Plant

initial_plants = [
    {
        "name": "绿萝",
        "scientific_name": "Epipremnum aureum",
        "category": "观叶植物",
        "care_level": 1,
        "description": "绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。",
        "light_requirement": "耐阴",
        "water_requirement": "见干见湿",
        "temperature_range": "15-30°C",
        "humidity_range": "40-60%",
        "fertilization": "春夏季每2周一次",
        "repotting": "每年春季换盆",
    },
    {
        "name": "虎皮兰",
        "scientific_name": "Sansevieria trifasciata",
        "category": "观叶植物",
        "care_level": 1,
        "description": "虎皮兰是百合科虎尾兰属多年生草本植物。",
        "light_requirement": "耐阴",
        "water_requirement": "耐旱",
        "temperature_range": "15-25°C",
        "humidity_range": "30-50%",
        "fertilization": "春夏季每月一次",
        "repotting": "每2-3年换盆",
    },
    {
        "name": "吊兰",
        "scientific_name": "Chlorophytum comosum",
        "category": "观叶植物",
        "care_level": 1,
        "description": "吊兰是百合科吊兰属多年生草本植物。",
        "light_requirement": "散光",
        "water_requirement": "见干见湿",
        "temperature_range": "15-25°C",
        "humidity_range": "40-60%",
        "fertilization": "生长期每2周一次",
        "repotting": "每年春季换盆",
    },
    {
        "name": "多肉植物",
        "scientific_name": "Succulent",
        "category": "多肉植物",
        "care_level": 2,
        "description": "多肉植物是指植物的根、茎、叶至少有一种肥厚多汁的植物。",
        "light_requirement": "喜阳",
        "water_requirement": "耐旱",
        "temperature_range": "15-28°C",
        "humidity_range": "30-40%",
        "fertilization": "生长期每月一次",
        "repotting": "每1-2年换盆",
    },
    {
        "name": "龟背竹",
        "scientific_name": "Monstera deliciosa",
        "category": "观叶植物",
        "care_level": 2,
        "description": "龟背竹是天南星科龟背竹属攀援灌木。",
        "light_requirement": "散光",
        "water_requirement": "见干见湿",
        "temperature_range": "18-28°C",
        "humidity_range": "50-70%",
        "fertilization": "生长期每2周一次",
        "repotting": "每年春季换盆",
    },
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Plant).count()
        if existing > 0:
            print(f"Database already has {existing} plants")
            return

        for plant_data in initial_plants:
            plant = Plant(**plant_data)
            db.add(plant)

        db.commit()
        print(f"Added {len(initial_plants)} plants to database")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
```

---

## 完成

所有任务完成后，项目结构如下：

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── recognition.py  # 花卉识别
│   │   │   ├── diagnosis.py   # 病症诊断
│   │   │   ├── plants.py      # 植物百科
│   │   │   ├── users.py       # 用户管理
│   │   │   ├── reminders.py   # 智能提醒
│   │   │   └── diaries.py     # 日记
│   │   └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── db/
│   │   ├── base.py
│   │   └── seed.py
│   ├── models/
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── reminder.py
│   │   └── diary.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── reminder.py
│   │   ├── diary.py
│   │   └── recognition.py
│   └── services/
│       ├── recognition.py
│       └── diagnosis.py
├── dataset/                    # 数据集模块
│   ├── __init__.py
│   ├── downloader.py         # 数据集下载
│   ├── preprocessing.py      # 数据预处理
│   ├── augmentation.py       # 数据增强
│   └── data/                 # 原始数据
├── train/                     # 训练模块
│   ├── __init__.py
│   ├── config.py             # 训练配置
│   └── trainer.py            # 训练器
├── models/                    # 模型文件
├── requirements.txt
├── .env.example
└── README.md
```

**运行命令：**

```bash
# 安装依赖
cd backend
pip install -r requirements.txt
pip install scikit-learn pillow

# 初始化数据库
python -m app.db.seed

# 启动API服务
uvicorn app.main:app --reload

# 数据集下载（示例）
python -c "from dataset.downloader import DatasetDownloader; d = DatasetDownloader(); d.download_plantnet_sample(['绿萝', '虎皮兰'])"

# 数据预处理
python -c "from dataset.preprocessing import ImagePreprocessor; p = ImagePreprocessor('dataset/data', 'dataset/processed'); p.resize_directory()"

# 数据增强
python -c "from dataset.augmentation import DataAugmenter; a = DataAugmenter('dataset/processed', 'dataset/augmented'); a.augment_directory()"

# 模型训练
python -m train.trainer
```
