from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.database import engine
from app.db.base import Base
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化植物数据
    from app.db.seed_plants import seed_plants
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_plants(db)
    finally:
        db.close()
    yield


app = FastAPI(title="护花使者 API", version="1.0.0", lifespan=lifespan)

# Create database tables
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "护花使者 API"}


@app.get("/health")
def health_check():
    # 尝试导入服务，如果失败则返回警告
    try:
        from app.services.recognition import plant_recognition_service
        from app.services.pest_recognition import pest_recognition_service

        return {
            "status": "healthy",
            "plant_model": plant_recognition_service.model is not None,
            "pest_model": pest_recognition_service.model is not None
        }
    except Exception as e:
        return {
            "status": "healthy",
            "warning": str(e)
        }


@app.get("/models/status")
def models_status():
    """获取模型状态"""
    try:
        from app.services.recognition import plant_recognition_service
        from app.services.pest_recognition import pest_recognition_service

        return {
            "plant": {
                "loaded": plant_recognition_service.model is not None,
                "classes_count": len(plant_recognition_service.classes),
                "model_path": plant_recognition_service.model_path
            },
            "pest": {
                "loaded": pest_recognition_service.model is not None,
                "classes_count": len(pest_recognition_service.classes),
                "model_path": pest_recognition_service.model_path
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "plant": {"loaded": False, "classes_count": 0},
            "pest": {"loaded": False, "classes_count": 0}
        }
