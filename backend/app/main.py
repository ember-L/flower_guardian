from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.database import engine
from app.db.base import Base

app = FastAPI(title="护花使者 API", version="1.0.0")

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
    return {"status": "healthy"}
