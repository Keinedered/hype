from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import get_current_admin
from typing import Optional

router = APIRouter()


@router.get('/admin/analytics')
def get_analytics(
    time_range: str = Query('all', description="Time range: all, month, week, day"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить аналитику платформы"""
    from datetime import datetime, timedelta
    
    # Определяем временной диапазон
    now = datetime.utcnow()
    if time_range == 'day':
        start_date = now - timedelta(days=1)
    elif time_range == 'week':
        start_date = now - timedelta(weeks=1)
    elif time_range == 'month':
        start_date = now - timedelta(days=30)
    else:
        start_date = None
    
    # Общая статистика пользователей
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    active_users_query = db.query(func.count(models.User.id)).filter(models.User.is_active == True)
    if start_date:
        active_users_query = active_users_query.filter(models.User.created_at >= start_date)
    active_users = active_users_query.scalar() or 0
    
    # Статистика курсов
    total_courses = db.query(func.count(models.Course.id)).scalar() or 0
    published_courses = db.query(func.count(models.Course.id)).filter(
        models.Course.status == 'published'
    ).scalar() or 0
    
    # Статистика submissions
    total_submissions = db.query(func.count(models.Submission.id)).scalar() or 0
    pending_submissions = db.query(func.count(models.Submission.id)).filter(
        models.Submission.status == models.SubmissionStatus.pending
    ).scalar() or 0
    completed_submissions = db.query(func.count(models.Submission.id)).filter(
        models.Submission.status == models.SubmissionStatus.accepted
    ).scalar() or 0
    
    # Средний прогресс по курсам
    user_courses = db.query(models.UserCourse).all()
    if user_courses:
        total_progress = sum(uc.progress or 0 for uc in user_courses)
        avg_completion = (total_progress / len(user_courses)) * 100 if user_courses else 0
    else:
        avg_completion = 0
    
    # Прогресс по каждому курсу
    course_progress = []
    courses = db.query(models.Course).all()
    for course in courses:
        course_user_courses = db.query(models.UserCourse).filter(
            models.UserCourse.course_id == course.id
        ).all()
        
        enrolled_users = len(course_user_courses)
        if enrolled_users > 0:
            completed_users = sum(1 for uc in course_user_courses if (uc.progress or 0) >= 100)
            avg_progress = (sum(uc.progress or 0 for uc in course_user_courses) / enrolled_users) if enrolled_users > 0 else 0
        else:
            completed_users = 0
            avg_progress = 0
        
        course_progress.append({
            'courseId': course.id,
            'courseTitle': course.title,
            'enrolledUsers': enrolled_users,
            'completedUsers': completed_users,
            'averageProgress': avg_progress
        })
    
    return {
        'totalUsers': total_users,
        'activeUsers': active_users,
        'totalCourses': total_courses,
        'publishedCourses': published_courses,
        'totalSubmissions': total_submissions,
        'pendingSubmissions': pending_submissions,
        'completedSubmissions': completed_submissions,
        'averageCompletionRate': avg_completion,
        'courseProgress': course_progress
    }

