from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import get_current_admin

router = APIRouter()


# ==================== ASSIGNMENTS ====================

@router.post('/admin/assignments', response_model=schemas.Assignment, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новое задание"""
    # Проверяем, что для урока еще нет задания
    existing = db.query(models.Assignment).filter(models.Assignment.lesson_id == assignment.lesson_id).first()
    if existing:
        raise HTTPException(status_code=400, detail='Assignment already exists for this lesson')
    
    new_assignment = models.Assignment(**assignment.dict())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment


@router.get('/admin/assignments', response_model=List[schemas.Assignment])
def list_assignments(
    lesson_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех заданий"""
    query = db.query(models.Assignment)
    if lesson_id:
        query = query.filter(models.Assignment.lesson_id == lesson_id)
    return query.all()


@router.get('/admin/assignments/{assignment_id}', response_model=schemas.Assignment)
def get_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить задание по ID"""
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    return assignment


@router.put('/admin/assignments/{assignment_id}', response_model=schemas.Assignment)
def update_assignment(
    assignment_id: str,
    assignment: schemas.AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить задание"""
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    
    update_data = assignment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.delete('/admin/assignments/{assignment_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить задание"""
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    
    db.delete(assignment)
    db.commit()
    return None


# ==================== SUBMISSIONS REVIEW ====================

@router.get('/admin/submissions', response_model=List[schemas.Submission])
def list_submissions(
    assignment_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    status_filter: Optional[schemas.SubmissionStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех работ студентов"""
    query = db.query(models.Submission)
    
    if assignment_id:
        query = query.filter(models.Submission.assignment_id == assignment_id)
    if user_id:
        query = query.filter(models.Submission.user_id == user_id)
    if status_filter:
        query = query.filter(models.Submission.status == status_filter)
    
    return query.order_by(models.Submission.submitted_at.desc()).all()


@router.get('/admin/submissions/{submission_id}', response_model=schemas.Submission)
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить работу студента по ID"""
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail='Submission not found')
    return submission


@router.put('/admin/submissions/{submission_id}/grade')
def grade_submission(
    submission_id: str,
    status: schemas.SubmissionStatus = Query(..., description="Submission status"),
    curator_comment: Optional[str] = Query(None, description="Curator comment"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Оценить работу студента"""
    from datetime import datetime
    
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail='Submission not found')
    
    submission.status = status
    if curator_comment:
        submission.curator_comment = curator_comment
    submission.reviewed_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return {'message': 'Submission graded successfully', 'submission': submission}
