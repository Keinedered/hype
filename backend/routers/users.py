from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/users")


@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_active_user)):
    """Получить информацию о текущем пользователе"""
    return current_user



@router.patch("/me", response_model=schemas.User)
def update_current_user_info(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """???????? ??????? ???????? ????????????"""
    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already in use")

    if user_update.username and user_update.username != current_user.username:
        existing_username = db.query(models.User).filter(models.User.username == user_update.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already in use")

    updated_user = crud.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return updated_user
