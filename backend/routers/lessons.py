from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/lessons")


def _resolve_lesson_status(db: Session, user_id: str, lesson: models.Lesson) -> Optional[models.CourseStatus]:
    """Определить статус урока для пользователя."""
    user_lesson = (
        db.query(models.UserLesson)
        .filter(models.UserLesson.user_id == user_id, models.UserLesson.lesson_id == lesson.id)
        .first()
    )
    if user_lesson:
        return user_lesson.status

    submission = (
        db.query(models.Submission)
        .join(models.Assignment, models.Submission.assignment_id == models.Assignment.id)
        .filter(
            models.Assignment.lesson_id == lesson.id,
            models.Submission.user_id == user_id,
        )
        .order_by(models.Submission.created_at.desc())
        .first()
    )
    if submission:
        if submission.status == models.SubmissionStatus.accepted:
            return models.CourseStatus.completed
        if submission.status in (models.SubmissionStatus.pending, models.SubmissionStatus.needs_revision):
            return models.CourseStatus.in_progress
    return None


@router.get("/module/{module_id}", response_model=List[schemas.Lesson])
def get_module_lessons(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Получить все уроки модуля"""
    lessons = crud.get_lessons(db, module_id)
    for lesson in lessons:
        status = _resolve_lesson_status(db, current_user.id, lesson)
        lesson.status = status
    return lessons


@router.get("/{lesson_id}", response_model=schemas.Lesson)
def get_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Получить урок по ID"""
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    status = _resolve_lesson_status(db, current_user.id, lesson)
    lesson.status = status
    return lesson


@router.post("/{lesson_id}/progress")
def update_lesson_progress(
    lesson_id: str,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновить прогресс по уроку"""
    return crud.update_lesson_progress(db, current_user.id, lesson_id, status)
