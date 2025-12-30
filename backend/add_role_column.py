"""
Скрипт для добавления колонки role в таблицу users
"""
from sqlalchemy import text
from database import engine

def add_role_column():
    """Добавляет колонку role в таблицу users если её нет"""
    with engine.connect() as conn:
        # Проверяем, существует ли колонка
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='role'
        """))
        
        if result.fetchone():
            print("✓ Колонка role уже существует")
            return
        
        # Создаем enum тип если его нет
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE userrole AS ENUM ('student', 'teacher', 'admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        # Добавляем колонку
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN role userrole DEFAULT 'student' NOT NULL;
        """))
        
        conn.commit()
        print("✓ Колонка role успешно добавлена")

if __name__ == "__main__":
    add_role_column()

