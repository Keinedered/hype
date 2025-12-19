from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/courses")


@router.get("/", response_model=List[schemas.CourseWithProgress])
def get_courses(
    track_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """Получить все курсы с прогрессом пользователя"""
    user_id = current_user.id if current_user else None
    return crud.get_courses(db, track_id=track_id, user_id=user_id)


@router.get("/{course_id}", response_model=schemas.CourseWithProgress)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """Получить курс по ID с прогрессом"""
    user_id = current_user.id if current_user else None
    course = crud.get_course(db, course_id, user_id=user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/{course_id}/progress")
def update_course_progress(
    course_id: str,
    progress: float,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновить прогресс по курсу"""
    return crud.update_course_progress(db, current_user.id, course_id, progress, status)

