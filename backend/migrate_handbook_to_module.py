"""
Миграция для изменения таблицы handbooks: замена course_id на module_id
ВНИМАНИЕ: Этот скрипт не сохраняет данные из course_id, так как нет прямой связи между курсами и модулями
Если нужно сохранить данные, их нужно мигрировать вручную
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Получаем URL базы данных из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hype")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def migrate_handbook_table():
    """Мигрирует таблицу handbooks с course_id на module_id"""
    session = Session()
    
    try:
        # Проверяем, существует ли колонка course_id
        check_column_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='handbooks' AND column_name='course_id'
        """)
        result = session.execute(check_column_query).fetchone()
        
        if not result:
            print("Колонка course_id не найдена в таблице handbooks. Миграция не требуется.")
            return
        
        # Проверяем, существует ли колонка module_id
        check_module_column_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='handbooks' AND column_name='module_id'
        """)
        module_result = session.execute(check_module_column_query).fetchone()
        
        if module_result:
            print("Колонка module_id уже существует. Миграция не требуется.")
            return
        
        print("Начинаем миграцию handbooks с course_id на module_id...")
        
        # Удаляем внешний ключ и индекс для course_id
        print("Удаляем внешний ключ для course_id...")
        try:
            session.execute(text("ALTER TABLE handbooks DROP CONSTRAINT IF EXISTS handbooks_course_id_fkey"))
            session.commit()
        except Exception as e:
            print(f"Предупреждение при удалении внешнего ключа: {e}")
            session.rollback()
        
        # Добавляем новую колонку module_id
        print("Добавляем колонку module_id...")
        session.execute(text("""
            ALTER TABLE handbooks 
            ADD COLUMN module_id VARCHAR
        """))
        session.commit()
        
        # ВАЖНО: Здесь нужно будет вручную заполнить module_id на основе course_id
        # Например, можно взять первый модуль курса:
        # UPDATE handbooks h
        # SET module_id = (SELECT id FROM modules WHERE course_id = h.course_id LIMIT 1)
        # WHERE module_id IS NULL;
        
        print("Колонка module_id добавлена. ВАЖНО: Заполните module_id вручную!")
        print("Пример запроса для заполнения (замените на вашу логику):")
        print("UPDATE handbooks h")
        print("SET module_id = (SELECT id FROM modules WHERE course_id = h.course_id LIMIT 1)")
        print("WHERE module_id IS NULL;")
        
        # Удаляем старую колонку course_id
        print("Удаляем старую колонку course_id...")
        session.execute(text("ALTER TABLE handbooks DROP COLUMN course_id"))
        session.commit()
        
        # Добавляем внешний ключ для module_id
        print("Добавляем внешний ключ для module_id...")
        session.execute(text("""
            ALTER TABLE handbooks 
            ADD CONSTRAINT handbooks_module_id_fkey 
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        """))
        session.commit()
        
        # Добавляем индекс
        print("Добавляем индекс для module_id...")
        session.execute(text("CREATE INDEX IF NOT EXISTS ix_handbooks_module_id ON handbooks(module_id)"))
        session.commit()
        
        print("Миграция успешно завершена!")
        
    except Exception as e:
        session.rollback()
        print(f"Ошибка при миграции: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_handbook_table()

