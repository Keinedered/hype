from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import json
import time

import os
# Путь к логу: используем переменную окружения или относительный путь
log_path = os.getenv('DEBUG_LOG_PATH', '/app/.cursor/debug.log')
# Если путь не существует, пробуем создать директорию
try:
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
except Exception:
    pass

# #region agent log
try:
    log_entry = {
        "location": "database.py:7",
        "message": "Creating database engine",
        "data": {
            "database_url": settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else "hidden"
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-session",
        "runId": "initial",
        "hypothesisId": "C"
    }
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
except Exception:
    pass
# #endregion

try:
    engine = create_engine(settings.DATABASE_URL)
    # #region agent log
    try:
        log_entry = {
            "location": "database.py:25",
            "message": "Database engine created successfully",
            "data": {},
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "initial",
            "hypothesisId": "C"
        }
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    except Exception:
        pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        log_entry = {
            "location": "database.py:30",
            "message": "Failed to create database engine",
            "data": {
                "error": str(e),
                "error_type": type(e).__name__
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "initial",
            "hypothesisId": "C"
        }
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    except Exception:
        pass
    # #endregion
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency для получения сессии БД"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

