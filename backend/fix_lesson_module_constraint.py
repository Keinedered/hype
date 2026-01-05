"""
Миграция для исправления структуры БД:
1. Удаляет уроки без модуля (если такие есть)
2. Изменяет module_id в таблице lessons на NOT NULL
3. Изменяет ondelete с SET NULL на CASCADE
"""
from sqlalchemy import text
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_lesson_module_constraint():
    """Исправить ограничения для module_id в таблице lessons"""
    db = SessionLocal()
    try:
        # 1. Удаляем уроки без модуля (если такие есть)
        logger.info("Удаление уроков без модуля...")
        result = db.execute(text("""
            DELETE FROM lessons 
            WHERE module_id IS NULL
        """))
        deleted_count = result.rowcount
        logger.info(f"Удалено уроков без модуля: {deleted_count}")
        db.commit()
        
        # 2. Удаляем внешний ключ (если существует)
        logger.info("Удаление старого внешнего ключа...")
        try:
            db.execute(text("""
                ALTER TABLE lessons 
                DROP CONSTRAINT IF EXISTS lessons_module_id_fkey
            """))
            db.commit()
            logger.info("Старый внешний ключ удален")
        except Exception as e:
            logger.warning(f"Ошибка при удалении старого ключа (возможно, его нет): {e}")
            db.rollback()
        
        # 3. Изменяем колонку module_id на NOT NULL
        logger.info("Изменение module_id на NOT NULL...")
        db.execute(text("""
            ALTER TABLE lessons 
            ALTER COLUMN module_id SET NOT NULL
        """))
        db.commit()
        logger.info("module_id изменен на NOT NULL")
        
        # 4. Создаем новый внешний ключ с CASCADE
        logger.info("Создание нового внешнего ключа с CASCADE...")
        db.execute(text("""
            ALTER TABLE lessons 
            ADD CONSTRAINT lessons_module_id_fkey 
            FOREIGN KEY (module_id) 
            REFERENCES modules(id) 
            ON DELETE CASCADE
        """))
        db.commit()
        logger.info("Новый внешний ключ создан")
        
        logger.info("✓ Миграция успешно завершена")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка при выполнении миграции: {e}", exc_info=True)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_lesson_module_constraint()

