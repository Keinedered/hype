"""
Добавить колонки status и published_at в таблицу lessons
"""
from sqlalchemy import text
from database import engine

def add_lesson_status_columns():
    """Добавить колонки status и published_at если их нет"""
    with engine.connect() as conn:
        # Добавляем колонку status
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='lessons' AND column_name='status'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку status в таблицу lessons...")
            conn.execute(text("""
                ALTER TABLE lessons 
                ADD COLUMN status VARCHAR DEFAULT 'draft'
            """))
            conn.commit()
            print("✓ Колонка status добавлена")
            
            # Создаем индекс для быстрого поиска по статусу
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status)
            """))
            conn.commit()
            print("✓ Индекс для status создан")
        else:
            print("✓ Колонка status уже существует")
        
        # Добавляем колонку published_at
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='lessons' AND column_name='published_at'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку published_at в таблицу lessons...")
            conn.execute(text("""
                ALTER TABLE lessons 
                ADD COLUMN published_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✓ Колонка published_at добавлена")
        else:
            print("✓ Колонка published_at уже существует")

if __name__ == "__main__":
    add_lesson_status_columns()

