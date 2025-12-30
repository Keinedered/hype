from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import get_current_admin

router = APIRouter()


def user_to_schema(user: models.User) -> schemas.User:
    """Преобразует модель User в схему User"""
    return schemas.User(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.get('/admin/users', response_model=List[schemas.User])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех пользователей"""
    users = db.query(models.User).all()
    return [user_to_schema(user) for user in users]


@router.get('/admin/users/{user_id}', response_model=schemas.User)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить пользователя по ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user_to_schema(user)


@router.put('/admin/users/{user_id}', response_model=schemas.User)
def update_user(
    user_id: str,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить пользователя"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail='User not found')
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return user_to_schema(db_user)


@router.delete('/admin/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить пользователя"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Не позволяем удалять самого себя
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail='Cannot delete yourself')
    
    db.delete(user)
    db.commit()
    return None

