import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.database import engine
from app.db.base import Base
from contextlib import asynccontextmanager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 导入所有模型以确保表被创建
from app.models import User, Plant, UserPlant, Reminder, Diary, Product, Order, OrderItem, CartItem, Payment, DiagnosisRecord, Address, EmailVerification

# 定时任务调度器
scheduler = None


def setup_scheduler():
    """配置定时任务"""
    global scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        from app.tasks.reminder_tasks import (
            check_upcoming_reminders,
            refresh_weather_factors,
            send_daily_reminders,
            send_overdue_reminders
        )

        scheduler = AsyncIOScheduler()

        # 每小时检查即将到期的提醒
        scheduler.add_job(
            check_upcoming_reminders,
            CronTrigger(minute=0),
            id="check_reminders",
            replace_existing=True
        )

        # 每日9点发送提醒
        scheduler.add_job(
            send_daily_reminders,
            CronTrigger(hour=9, minute=0),
            id="daily_reminders",
            replace_existing=True
        )

        # 每6小时刷新天气
        scheduler.add_job(
            refresh_weather_factors,
            CronTrigger(hour="*/6"),
            id="refresh_weather",
            replace_existing=True
        )

        # 每3小时检查逾期提醒
        scheduler.add_job(
            send_overdue_reminders,
            CronTrigger(hour="*/3"),
            id="overdue_reminders",
            replace_existing=True
        )

        scheduler.start()
        logging.info("定时任务调度器已启动")
    except ImportError:
        logging.warning("APScheduler 未安装，跳过定时任务配置")


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

    # 启动定时任务
    setup_scheduler()

    yield

    # 关闭定时任务
    if scheduler:
        scheduler.shutdown()
        logging.info("定时任务调度器已关闭")


app = FastAPI(title="护花使者 API", version="1.0.0", lifespan=lifespan)

# 挂载静态文件目录（植物图片）
app.mount("/static", StaticFiles(directory="static"), name="static")

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
