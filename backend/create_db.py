"""
Скрипт для создания базы данных graph_db, если она не существует
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

def create_database_if_not_exists():
    """Создает базу данных graph_db, если она не существует"""
    # Подключаемся к системной базе данных postgres
    db_url = os.getenv('DATABASE_URL', 'postgresql://graph_user:graph_password@postgres:5432/graph_db')
    
    # Извлекаем параметры подключения и подключаемся к postgres
    if '/graph_db' in db_url:
        admin_url = db_url.rsplit('/', 1)[0] + '/postgres'
    else:
        admin_url = db_url
    
    try:
        admin_engine = create_engine(admin_url, pool_pre_ping=True, isolation_level="AUTOCOMMIT")
        with admin_engine.connect() as conn:
            # Проверяем существование базы данных
            result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='graph_db'"))
            if not result.fetchone():
                print('   📦 Создание базы данных graph_db...')
                conn.execute(text('CREATE DATABASE graph_db'))
                print('   ✅ База данных graph_db создана')
            else:
                print('   ✅ База данных graph_db уже существует')
        return True
    except Exception as e:
        print(f'   ⚠️  Не удалось проверить/создать базу данных: {e}')
        # Продолжаем работу, возможно база уже создана через POSTGRES_DB
        return False

if __name__ == "__main__":
    if create_database_if_not_exists():
        sys.exit(0)
    else:
        sys.exit(1)

