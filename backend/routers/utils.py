"""Утилиты для роутеров"""
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
import models

logger = logging.getLogger(__name__)


def update_course_module_count(db: Session, course_id: str) -> None:
    """Обновить счетчик модулей в курсе"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if course:
        course.module_count = db.query(models.Module).filter(
            models.Module.course_id == course_id
        ).count()


def update_course_lesson_count(db: Session, course_id: str) -> None:
    """Обновить счетчик уроков в курсе"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if course:
        # Считаем только уроки, которые привязаны к модулям этого курса
        # Все уроки должны быть привязаны к модулям (module_id обязателен)
        course.lesson_count = db.query(models.Lesson).join(
            models.Module
        ).filter(
            models.Module.course_id == course_id
        ).count()


def safe_commit(db: Session, operation_name: str = "operation") -> None:
    """Безопасное выполнение commit с обработкой ошибок"""
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing {operation_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

