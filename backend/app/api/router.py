from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries, recognition, diagnosis, pest_diagnosis
from app.api.endpoints.products import router as products_router, public_router as products_public_router
from app.api.endpoints.orders import router as orders_router, admin_router as orders_admin_router
from app.api.endpoints.admin_users import router as admin_users_router
from app.api.endpoints.admin_plants import router as admin_plants_router
from app.api.endpoints.admin_stats import router as admin_stats_router
from app.api.endpoints.cart import router as cart_router
from app.api.endpoints.payments import router as payments_router
from app.api.endpoints.diagnoses import router as diagnoses_router
from app.api.endpoints.recommend import router as recommend_router
from app.api.endpoints.addresses import router as addresses_router
from app.api.endpoints.email_verification import router as email_verification_router
from app.api.endpoints.ai_chat import router as ai_chat_router
from app.api.endpoints.weather import router as weather_router
from app.api.endpoints.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(email_verification_router)
api_router.include_router(plants.router)
api_router.include_router(reminders.router)
api_router.include_router(diaries.router)
api_router.include_router(recognition.router)
api_router.include_router(diagnosis.router)
api_router.include_router(pest_diagnosis.router)
api_router.include_router(products_router)
api_router.include_router(products_public_router)
api_router.include_router(orders_router)
api_router.include_router(orders_admin_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_plants_router)
api_router.include_router(admin_stats_router)
api_router.include_router(cart_router)
api_router.include_router(payments_router)
api_router.include_router(diagnoses_router)
api_router.include_router(recommend_router)
api_router.include_router(addresses_router)
api_router.include_router(ai_chat_router)
api_router.include_router(weather_router)
api_router.include_router(chat_router)
