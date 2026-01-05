from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from fastapi import HTTPException, status
from config import settings

try:
    # Логируем используемый DATABASE_URL (без пароля)
    db_url_for_log = settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL
    print(f"🔗 Подключение к базе данных: {db_url_for_log}")
    
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,  # Проверка соединения перед использованием
        pool_recycle=300,    # Переподключение каждые 5 минут
        echo=False,  # Не логируем SQL запросы
    )
except Exception as e:
    print(f"❌ Ошибка создания engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency для получения сессии БД"""
    db = SessionLocal()
    try:
        # Проверяем подключение к БД
        db.execute(text("SELECT 1"))
        yield db
    except (OperationalError, DisconnectionError) as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        db.close()

