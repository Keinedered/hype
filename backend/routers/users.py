from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas
from auth import get_current_active_user
import models

router = APIRouter(prefix="/users")


@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_active_user)):
    """Получить информацию о текущем пользователе"""
    return current_user

