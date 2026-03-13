from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

import models
from config import settings
from database import Base, engine

# Uncomment when migrating database, so the container would not crash:
#while True: pass

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

# Create app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount(settings.PUBLIC_UPLOADS_URL_PREFIX, StaticFiles(directory=str(uploads_dir)), name="uploads")

# Routers
from routers import admin, auth, courses, graph, lessons, modules, notifications, submissions, tracks, users

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(tracks.router, prefix=settings.API_V1_STR, tags=["tracks"])
app.include_router(courses.router, prefix=settings.API_V1_STR, tags=["courses"])
app.include_router(modules.router, prefix=settings.API_V1_STR, tags=["modules"])
app.include_router(lessons.router, prefix=settings.API_V1_STR, tags=["lessons"])
app.include_router(graph.router, prefix=settings.API_V1_STR, tags=["graph"])
app.include_router(submissions.router, prefix=settings.API_V1_STR, tags=["submissions"])
app.include_router(notifications.router, prefix=settings.API_V1_STR, tags=["notifications"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["admin"])


@app.get("/")
def read_root():
    return {
        "message": "GRAPH Educational Platform API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
