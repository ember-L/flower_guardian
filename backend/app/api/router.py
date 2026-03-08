from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries, recognition, diagnosis

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
api_router.include_router(diaries.router)
api_router.include_router(recognition.router)
api_router.include_router(diagnosis.router)
