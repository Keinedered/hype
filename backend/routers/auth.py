from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from database import get_db
import schemas
import crud
from auth import (
    authenticate_user, 
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    get_user_by_username, 
    get_user_by_email,
    get_current_active_user
)
from config import settings

router = APIRouter(prefix="/auth")
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=schemas.User)
@limiter.limit("5/minute")  # Максимум 5 попыток регистрации в минуту
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверка существования username
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Проверка существования email
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_user(db=db, user=user)


@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("10/minute")  # Максимум 10 попыток входа в минуту
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход пользователя - возвращает access и refresh токены"""
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Создаем access токен
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Создаем refresh токен
        refresh_token = create_refresh_token(user.id, db)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )


@router.post("/refresh", response_model=schemas.RefreshTokenResponse)
@limiter.limit("20/minute")  # Максимум 20 обновлений токена в минуту
def refresh_token_endpoint(request: Request, 
    request_data: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Обновление access токена с использованием refresh токена"""
    try:
        # Проверяем refresh токен
        refresh_token_db = verify_refresh_token(request_data.refresh_token, db)
        if not refresh_token_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Получаем пользователя
        user = db.query(crud.models.User).filter(crud.models.User.id == refresh_token_db.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Создаем новый access токен
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh error: {str(e)}"
        )


@router.post("/logout")
def logout(
    current_user: crud.models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Logout - отозвать все refresh токены пользователя"""
    try:
        # Отозвать все refresh токены пользователя
        refresh_tokens = db.query(crud.models.RefreshToken).filter(
            crud.models.RefreshToken.user_id == current_user.id,
            crud.models.RefreshToken.is_revoked == False
        ).all()
        
        for token in refresh_tokens:
            token.is_revoked = True
        
        db.commit()
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout error: {str(e)}"
        )

