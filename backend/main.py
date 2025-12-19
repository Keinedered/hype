from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
import models

# Создание таблиц
Base.metadata.create_all(bind=engine)

# Создание приложения
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Импорт роутеров
from routers import auth, tracks, courses, modules, lessons, graph, submissions, notifications, users

# Подключение роутеров
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(tracks.router, prefix=settings.API_V1_STR, tags=["tracks"])
app.include_router(courses.router, prefix=settings.API_V1_STR, tags=["courses"])
app.include_router(modules.router, prefix=settings.API_V1_STR, tags=["modules"])
app.include_router(lessons.router, prefix=settings.API_V1_STR, tags=["lessons"])
app.include_router(graph.router, prefix=settings.API_V1_STR, tags=["graph"])
app.include_router(submissions.router, prefix=settings.API_V1_STR, tags=["submissions"])
app.include_router(notifications.router, prefix=settings.API_V1_STR, tags=["notifications"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])


@app.get("/")
def read_root():
    return {
        "message": "GRAPH Educational Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}

