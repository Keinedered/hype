from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import schemas
import crud
import models
from auth import get_optional_user

router = APIRouter(prefix="/modules")


@router.get("/course/{course_id}", response_model=List[schemas.Module])
def get_course_modules(course_id: str, db: Session = Depends(get_db)):
    """Получить все модули курса"""
    return crud.get_modules(db, course_id)


@router.get("/{module_id}", response_model=schemas.Module)
def get_module(module_id: str, db: Session = Depends(get_db)):
    """Получить модуль по ID с уроками"""
    from sqlalchemy.orm import joinedload
    
    module = db.query(models.Module).options(
        joinedload(models.Module.lessons)
    ).filter(models.Module.id == module_id).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return module


@router.get("/{module_id}/progress")
def get_module_progress(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """Получить прогресс модуля (пройденные уроки / всего уроков)"""
    module = crud.get_module(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Получаем все уроки модуля
    lessons = db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id,
        models.Lesson.status == 'published'
    ).all()
    
    total_lessons = len(lessons)
    
    if total_lessons == 0:
        return {
            "module_id": module_id,
            "total_lessons": 0,
            "completed_lessons": 0,
            "progress": 0.0
        }
    
    if not current_user:
        return {
            "module_id": module_id,
            "total_lessons": total_lessons,
            "completed_lessons": 0,
            "progress": 0.0
        }
    
    # Подсчитываем пройденные уроки
    completed_lessons = db.query(models.UserLesson).filter(
        models.UserLesson.user_id == current_user.id,
        models.UserLesson.lesson_id.in_([lesson.id for lesson in lessons]),
        models.UserLesson.status == models.CourseStatus.completed
    ).count()
    
    progress = (completed_lessons / total_lessons) * 100 if total_lessons > 0 else 0.0
    
    return {
        "module_id": module_id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "progress": round(progress, 2)
    }
