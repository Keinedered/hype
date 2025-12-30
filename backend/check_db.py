"""
Скрипт для проверки подключения к PostgreSQL
Используется в docker-entrypoint.sh
"""
import sys
import time
import os

def check_postgres_connection(max_retries=30, retry_delay=2):
    """Проверка подключения к PostgreSQL"""
    # Используем DATABASE_URL из переменных окружения или дефолтное значение
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://graph_user:graph_password@postgres:5432/graph_db"
    )
    
    print(f"   Проверка подключения к: postgres:5432/graph_db")
    
    for attempt in range(max_retries):
        try:
            from sqlalchemy import create_engine, text
            from sqlalchemy.exc import OperationalError
            
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 3}
            )
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            print(f"   ✅ Подключение установлено (попытка {attempt + 1})")
            return True
        except ImportError as e:
            print(f"   ⚠️  SQLAlchemy еще не установлен, ждем... ({attempt + 1}/{max_retries})")
            time.sleep(retry_delay)
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"   ⏳ Попытка {attempt + 1}/{max_retries}: PostgreSQL еще не готов...")
                time.sleep(retry_delay)
            else:
                print(f"   ❌ Не удалось подключиться после {max_retries} попыток")
                print(f"   Ошибка: {str(e)}")
                return False
    
    return False

if __name__ == "__main__":
    if check_postgres_connection():
        sys.exit(0)
    else:
        sys.exit(1)

