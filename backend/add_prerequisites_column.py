"""
Скрипт для добавления отсутствующих колонок в таблицу modules
"""
from sqlalchemy import text
from database import engine
import sys

def add_missing_columns():
    """Добавляет отсутствующие колонки в таблицу modules"""
    columns_to_add = [
        {
            "name": "prerequisites",
            "type": "TEXT",
            "nullable": True
        },
        {
            "name": "created_at",
            "type": "TIMESTAMP WITH TIME ZONE",
            "nullable": True,
            "default": "CURRENT_TIMESTAMP"
        },
        {
            "name": "updated_at",
            "type": "TIMESTAMP WITH TIME ZONE",
            "nullable": True
        }
    ]
    
    try:
        with engine.connect() as conn:
            for col in columns_to_add:
                # Проверяем, существует ли колонка
                check_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='modules' AND column_name=:col_name
                """)
                result = conn.execute(check_query, {"col_name": col["name"]})
                if result.fetchone():
                    print(f"✓ Колонка {col['name']} уже существует в таблице modules")
                    continue
                
                # Формируем SQL для добавления колонки
                default_clause = ""
                if "default" in col:
                    default_clause = f" DEFAULT {col['default']}"
                
                alter_query = text(f"""
                    ALTER TABLE modules 
                    ADD COLUMN {col['name']} {col['type']}{default_clause}
                """)
                conn.execute(alter_query)
                print(f"✓ Колонка {col['name']} успешно добавлена в таблицу modules")
            
            conn.commit()
            print("✓ Все колонки успешно добавлены в таблицу modules")
    except Exception as e:
        print(f"✗ Ошибка при добавлении колонок: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("Добавление отсутствующих колонок в таблицу modules...")
    add_missing_columns()

