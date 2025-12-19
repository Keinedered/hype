from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import models
import schemas
from auth import get_password_hash
import uuid


# Users
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Создать пользователя"""
    db_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Tracks
def get_tracks(db: Session) -> List[models.Track]:
    """Получить все треки"""
    return db.query(models.Track).all()


def get_track(db: Session, track_id: str) -> Optional[models.Track]:
    """Получить трек по ID"""
    return db.query(models.Track).filter(models.Track.id == track_id).first()


# Courses
def get_courses(db: Session, track_id: Optional[str] = None, user_id: Optional[str] = None) -> List[dict]:
    """Получить все курсы с прогрессом пользователя"""
    query = db.query(models.Course).options(joinedload(models.Course.authors))
    
    if track_id:
        query = query.filter(models.Course.track_id == track_id)
    
    courses = query.all()
    
    # Если user_id передан, добавляем прогресс
    result = []
    for course in courses:
        course_dict = {
            "id": course.id,
            "track_id": course.track_id.value if hasattr(course.track_id, 'value') else course.track_id,
            "title": course.title,
            "version": course.version,
            "description": course.description,
            "short_description": course.short_description,
            "level": course.level.value if hasattr(course.level, 'value') else course.level,
            "module_count": course.module_count,
            "lesson_count": course.lesson_count,
            "task_count": course.task_count,
            "authors": [author.author_name for author in course.authors],
            "enrollment_deadline": course.enrollment_deadline,
            "created_at": course.created_at
        }
        
        if user_id:
            user_course = db.query(models.UserCourse).filter(
                models.UserCourse.user_id == user_id,
                models.UserCourse.course_id == course.id
            ).first()
            if user_course:
                course_dict["progress"] = user_course.progress
                course_dict["status"] = user_course.status.value if hasattr(user_course.status, 'value') else user_course.status
            else:
                course_dict["progress"] = None
                course_dict["status"] = "not_started"
        
        result.append(course_dict)
    
    return result


def get_course(db: Session, course_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    """Получить курс по ID с прогрессом"""
    course = db.query(models.Course).options(joinedload(models.Course.authors)).filter(
        models.Course.id == course_id
    ).first()
    
    if not course:
        return None
    
    course_dict = {
        "id": course.id,
        "track_id": course.track_id.value if hasattr(course.track_id, 'value') else course.track_id,
        "title": course.title,
        "version": course.version,
        "description": course.description,
        "short_description": course.short_description,
        "level": course.level.value if hasattr(course.level, 'value') else course.level,
        "module_count": course.module_count,
        "lesson_count": course.lesson_count,
        "task_count": course.task_count,
        "authors": [author.author_name for author in course.authors],
        "enrollment_deadline": course.enrollment_deadline,
        "created_at": course.created_at
    }
    
    if user_id:
        user_course = db.query(models.UserCourse).filter(
            models.UserCourse.user_id == user_id,
            models.UserCourse.course_id == course.id
        ).first()
        if user_course:
            course_dict["progress"] = user_course.progress
            course_dict["status"] = user_course.status.value if hasattr(user_course.status, 'value') else user_course.status
    
    return course_dict


# Modules
def get_modules(db: Session, course_id: str) -> List[models.Module]:
    """Получить все модули курса"""
    return db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).order_by(models.Module.order_index).all()


def get_module(db: Session, module_id: str) -> Optional[models.Module]:
    """Получить модуль по ID"""
    return db.query(models.Module).filter(models.Module.id == module_id).first()


# Lessons
def get_lessons(db: Session, module_id: str) -> List[models.Lesson]:
    """Получить все уроки модуля"""
    return db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id
    ).order_by(models.Lesson.order_index).all()


def get_lesson(db: Session, lesson_id: str) -> Optional[models.Lesson]:
    """Получить урок по ID"""
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id).first()


# Graph
def get_graph_nodes(db: Session, user_id: Optional[str] = None) -> List[models.GraphNode]:
    """Получить все узлы графа"""
    return db.query(models.GraphNode).all()


def get_graph_edges(db: Session) -> List[models.GraphEdge]:
    """Получить все ребра графа"""
    return db.query(models.GraphEdge).all()


# Submissions
def create_submission(db: Session, submission: schemas.SubmissionCreate, user_id: str) -> models.Submission:
    """Создать submission"""
    # Проверяем существующие submissions
    existing = db.query(models.Submission).filter(
        models.Submission.assignment_id == submission.assignment_id,
        models.Submission.user_id == user_id
    ).order_by(models.Submission.version.desc()).first()
    
    version = existing.version + 1 if existing else 1
    
    db_submission = models.Submission(
        id=str(uuid.uuid4()),
        assignment_id=submission.assignment_id,
        user_id=user_id,
        version=version,
        text_answer=submission.text_answer,
        link_url=submission.link_url,
        status=models.SubmissionStatus.pending,
        submitted_at=func.now()
    )
    db.add(db_submission)
    
    # Добавляем файлы если есть
    if submission.file_urls:
        for file_url in submission.file_urls:
            db_file = models.SubmissionFile(
                submission_id=db_submission.id,
                file_url=file_url
            )
            db.add(db_file)
    
    db.commit()
    db.refresh(db_submission)
    return db_submission


def get_user_submissions(db: Session, user_id: str) -> List[models.Submission]:
    """Получить все submissions пользователя"""
    return db.query(models.Submission).filter(
        models.Submission.user_id == user_id
    ).order_by(models.Submission.created_at.desc()).all()


# Notifications
def get_user_notifications(db: Session, user_id: str, unread_only: bool = False) -> List[models.Notification]:
    """Получить уведомления пользователя"""
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc()).all()


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Optional[models.Notification]:
    """Отметить уведомление как прочитанное"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification


# User progress
def update_course_progress(db: Session, user_id: str, course_id: str, progress: float, status: str):
    """Обновить прогресс по курсу"""
    user_course = db.query(models.UserCourse).filter(
        models.UserCourse.user_id == user_id,
        models.UserCourse.course_id == course_id
    ).first()
    
    if user_course:
        user_course.progress = progress
        user_course.status = status
        if status == "completed" and not user_course.completed_at:
            user_course.completed_at = func.now()
    else:
        user_course = models.UserCourse(
            user_id=user_id,
            course_id=course_id,
            progress=progress,
            status=status,
            started_at=func.now()
        )
        db.add(user_course)
    
    db.commit()
    return user_course


def update_lesson_progress(db: Session, user_id: str, lesson_id: str, status: str):
    """Обновить прогресс по уроку"""
    user_lesson = db.query(models.UserLesson).filter(
        models.UserLesson.user_id == user_id,
        models.UserLesson.lesson_id == lesson_id
    ).first()
    
    if user_lesson:
        user_lesson.status = status
        if status == "completed" and not user_lesson.completed_at:
            user_lesson.completed_at = func.now()
    else:
        user_lesson = models.UserLesson(
            user_id=user_id,
            lesson_id=lesson_id,
            status=status,
            completed_at=func.now() if status == "completed" else None
        )
        db.add(user_lesson)
    
    db.commit()
    return user_lesson

