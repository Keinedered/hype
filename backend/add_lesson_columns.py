"""
Добавить недостающие колонки в таблицу lessons
"""
from sqlalchemy import text
from database import engine

def add_lesson_columns():
    """Добавить недостающие колонки в таблицу lessons если их нет"""
    with engine.connect() as conn:
        # Список колонок для добавления
        columns_to_add = [
            {
                'name': 'content_type',
                'type': 'VARCHAR',
                'default': "'text'"
            },
            {
                'name': 'tags',
                'type': 'TEXT',
                'default': None
            },
            {
                'name': 'estimated_time',
                'type': 'INTEGER',
                'default': '0'
            },
            {
                'name': 'created_at',
                'type': 'TIMESTAMP WITH TIME ZONE',
                'default': None
            },
            {
                'name': 'updated_at',
                'type': 'TIMESTAMP WITH TIME ZONE',
                'default': None
            }
        ]
        
        for column in columns_to_add:
            # Проверяем, существует ли колонка
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='lessons' AND column_name='{column['name']}'
            """))
            
            if result.fetchone() is None:
                print(f"Добавляем колонку {column['name']} в таблицу lessons...")
                
                # Формируем SQL для добавления колонки
                sql = f"ALTER TABLE lessons ADD COLUMN {column['name']} {column['type']}"
                if column['default']:
                    sql += f" DEFAULT {column['default']}"
                
                conn.execute(text(sql))
                conn.commit()
                print(f"✓ Колонка {column['name']} добавлена")
            else:
                print(f"✓ Колонка {column['name']} уже существует")
        
        # Также проверяем, что module_id может быть NULL (если это еще не так)
        result = conn.execute(text("""
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name='lessons' AND column_name='module_id'
        """))
        
        row = result.fetchone()
        if row and row[0] == 'NO':
            print("Обновляем колонку module_id, чтобы она могла быть NULL...")
            conn.execute(text("""
                ALTER TABLE lessons 
                ALTER COLUMN module_id DROP NOT NULL
            """))
            conn.commit()
            print("✓ Колонка module_id теперь может быть NULL")

if __name__ == "__main__":
    add_lesson_columns()

