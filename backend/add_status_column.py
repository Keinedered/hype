"""
Добавить колонку status в таблицу courses
"""
from sqlalchemy import text
from database import engine

def add_status_column():
    """Добавить колонку status если её нет"""
    with engine.connect() as conn:
        # Проверяем, существует ли колонка
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='courses' AND column_name='status'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку status в таблицу courses...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN status VARCHAR DEFAULT 'draft'
            """))
            conn.commit()
            print("✓ Колонка status добавлена")
        else:
            print("✓ Колонка status уже существует")
        
        # Также проверяем другие колонки, которые могут отсутствовать
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='courses' AND column_name='created_by_id'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку created_by_id в таблицу courses...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN created_by_id VARCHAR
            """))
            conn.commit()
            print("✓ Колонка created_by_id добавлена")
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='courses' AND column_name='updated_at'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку updated_at в таблицу courses...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✓ Колонка updated_at добавлена")
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='courses' AND column_name='published_at'
        """))
        
        if result.fetchone() is None:
            print("Добавляем колонку published_at в таблицу courses...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN published_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✓ Колонка published_at добавлена")

if __name__ == "__main__":
    add_status_column()












