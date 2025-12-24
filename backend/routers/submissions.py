from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/submissions")


@router.post("/", response_model=schemas.Submission)
def create_submission(
    submission: schemas.SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Создать новый submission"""
    return crud.create_submission(db, submission, current_user.id)


@router.get("/", response_model=List[schemas.Submission])
def get_user_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получить все submissions текущего пользователя"""
    return crud.get_user_submissions(db, current_user.id)

