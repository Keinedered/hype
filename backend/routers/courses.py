from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import datetime
from database import get_db
import schemas
import crud
from auth import get_current_active_user, get_optional_user
import models

router = APIRouter(prefix="/courses")


@router.get("/", response_model=List[schemas.CourseWithProgress])
def get_courses(
    track_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """Получить все курсы с прогрессом пользователя (только опубликованные)"""
    user_id = current_user.id if current_user else None
    return crud.get_courses(db, track_id=track_id, user_id=user_id, published_only=True)


@router.get("/{course_id}", response_model=schemas.CourseWithProgress)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """Получить курс по ID с прогрессом (только опубликованные для неавторизованных)"""
    user_id = current_user.id if current_user else None
    published_only = current_user is None  # Для неавторизованных только опубликованные
    course = crud.get_course(db, course_id, user_id=user_id, published_only=published_only)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Записаться на курс"""
    # Проверяем существование курса
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Проверяем, что курс опубликован
    if course.status != 'published':
        raise HTTPException(status_code=400, detail="Course is not available for enrollment")
    
    # Проверяем, не записан ли уже пользователь на курс
    existing_enrollment = db.query(models.UserCourse).filter(
        models.UserCourse.user_id == current_user.id,
        models.UserCourse.course_id == course_id
    ).first()
    
    if existing_enrollment:
        # Если уже записан, возвращаем существующую запись и первый урок
        first_lesson_id = crud.get_first_lesson_id(db, course_id)
        return {
            "message": "Already enrolled",
            "user_course": {
                "user_id": existing_enrollment.user_id,
                "course_id": existing_enrollment.course_id,
                "status": existing_enrollment.status.value if hasattr(existing_enrollment.status, 'value') else existing_enrollment.status,
                "progress": existing_enrollment.progress
            },
            "first_lesson_id": first_lesson_id
        }
    
    # Создаем новую запись о записи на курс
    try:
        user_course = models.UserCourse(
            user_id=current_user.id,
            course_id=course_id,
            status=models.CourseStatus.not_started,
            progress=0.0,
            started_at=datetime.utcnow()
        )
        db.add(user_course)
        db.commit()
        db.refresh(user_course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to enroll in course: {str(e)}")
    
    # Получаем первый урок курса
    first_lesson_id = crud.get_first_lesson_id(db, course_id)
    
    return {
        "message": "Successfully enrolled",
        "user_course": {
            "user_id": user_course.user_id,
            "course_id": user_course.course_id,
            "status": user_course.status.value if hasattr(user_course.status, 'value') else user_course.status,
            "progress": user_course.progress
        },
        "first_lesson_id": first_lesson_id
    }


@router.post("/{course_id}/progress")
def update_course_progress(
    course_id: str,
    progress_data: schemas.CourseProgressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновить прогресс по курсу"""
    # Валидация прогресса
    if progress_data.progress < 0 or progress_data.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    try:
        return crud.update_course_progress(
            db, 
            current_user.id, 
            course_id, 
            progress_data.progress, 
            progress_data.status.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

