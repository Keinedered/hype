from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from config import settings
from database import engine, Base
import models
import os

# Создание таблиц
try:
    Base.metadata.create_all(bind=engine)
    # Добавляем колонки status и published_at в таблицу lessons, если их нет
    try:
        from add_lesson_status_columns import add_lesson_status_columns
        add_lesson_status_columns()
    except Exception as e:
        # Логируем ошибку, но не прерываем запуск
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Migration warning: {e}")
    # Исправляем структуру БД для соблюдения КУРС → МОДУЛИ → УРОКИ
    try:
        from fix_lesson_module_constraint import fix_lesson_module_constraint
        fix_lesson_module_constraint()
    except Exception as e:
        # Логируем ошибку, но не прерываем запуск (возможно, миграция уже выполнена)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Migration warning (fix_lesson_module_constraint): {e}")
except Exception as e:
    raise

# Создание приложения
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS - должен быть добавлен ПЕРЕД другими middleware
# Используем конкретные origins из настроек
cors_origins = settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Обработчик исключений для добавления CORS заголовков при ошибках
# Обрабатываем как StarletteHTTPException, так и FastAPI HTTPException
@app.exception_handler(StarletteHTTPException)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: Exception):
    # Получаем origin из запроса и проверяем, что он разрешен
    origin = request.headers.get("origin")
    if origin and origin in settings.BACKEND_CORS_ORIGINS:
        cors_origin = origin
    elif settings.BACKEND_CORS_ORIGINS:
        cors_origin = settings.BACKEND_CORS_ORIGINS[0]
    else:
        cors_origin = "*"
    
    detail = exc.detail if hasattr(exc, 'detail') else str(exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Обработчик RequestValidationError (422 ошибки валидации)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    origin = request.headers.get("origin")
    if origin and origin in settings.BACKEND_CORS_ORIGINS:
        cors_origin = origin
    elif settings.BACKEND_CORS_ORIGINS:
        cors_origin = settings.BACKEND_CORS_ORIGINS[0]
    else:
        cors_origin = "*"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Получаем origin из запроса и проверяем, что он разрешен
    origin = request.headers.get("origin")
    if origin and origin in settings.BACKEND_CORS_ORIGINS:
        cors_origin = origin
    elif settings.BACKEND_CORS_ORIGINS:
        cors_origin = settings.BACKEND_CORS_ORIGINS[0]
    else:
        cors_origin = "*"
    
    # Для других исключений возвращаем 500
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Импорт роутеров
from routers import auth, tracks, courses, modules, lessons, graph, submissions, notifications, users
from routers import admin_courses, admin_graph, admin_handbook, admin_assignments, admin_users, admin_analytics

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

# Admin routers
app.include_router(admin_courses.router, prefix=settings.API_V1_STR, tags=["admin-courses"])
app.include_router(admin_graph.router, prefix=settings.API_V1_STR, tags=["admin-graph"])
app.include_router(admin_handbook.router, prefix=settings.API_V1_STR, tags=["admin-handbook"])
app.include_router(admin_assignments.router, prefix=settings.API_V1_STR, tags=["admin-assignments"])
app.include_router(admin_users.router, prefix=settings.API_V1_STR, tags=["admin-users"])
app.include_router(admin_analytics.router, prefix=settings.API_V1_STR, tags=["admin-analytics"])

# Статические файлы для загруженных видео
uploads_dir = os.path.join(os.getcwd(), 'uploads')
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
def read_root():
    return {
        "message": "GRAPH Educational Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/v1")
def api_v1_info():
    """Информация об API v1"""
    return {
        "message": "GRAPH Educational Platform API v1",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "tracks": "/api/v1/tracks",
            "courses": "/api/v1/courses",
            "modules": "/api/v1/modules",
            "lessons": "/api/v1/lessons",
            "graph": "/api/v1/graph",
            "users": "/api/v1/users",
            "submissions": "/api/v1/submissions",
            "notifications": "/api/v1/notifications",
            "admin": {
                "courses": "/api/v1/admin/courses",
                "modules": "/api/v1/admin/modules",
                "lessons": "/api/v1/admin/lessons",
                "graph": "/api/v1/admin/graph",
                "assignments": "/api/v1/admin/assignments",
                "handbook": "/api/v1/admin/handbook-articles",
                "submissions": "/api/v1/admin/submissions"
            }
        },
        "docs": "/docs",
        "openapi": "/api/v1/openapi.json"
    }



