from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/lessons")


@router.get("/module/{module_id}", response_model=List[schemas.Lesson])
def get_module_lessons(module_id: str, db: Session = Depends(get_db)):
    """Получить все уроки модуля (только опубликованные для обычных пользователей)"""
    return crud.get_lessons(db, module_id, published_only=True)


@router.get("/{lesson_id}", response_model=schemas.Lesson)
def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    """Получить урок по ID (только опубликованные для обычных пользователей)"""
    lesson = crud.get_lesson(db, lesson_id, published_only=True)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/{lesson_id}/with-graph")
def get_lesson_with_graph(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получить урок с информацией о графе (координаты, связи)"""
    lesson_data = crud.get_lesson_with_graph_node(db, lesson_id)
    if not lesson_data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson_data


@router.post("/{lesson_id}/progress")
def update_lesson_progress(
    lesson_id: str,
    progress_data: schemas.LessonProgressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновить прогресс по уроку"""
    try:
        return crud.update_lesson_progress(db, current_user.id, lesson_id, progress_data.status.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

