from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    # Bcrypt ограничение: максимум 72 байта
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Получить пользователя по username"""
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Получить пользователя по email"""
    return db.query(models.User).filter(models.User.email == email).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """Аутентификация пользователя"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Получить текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Проверка активности пользователя"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user



async def get_current_admin(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Проверка прав администратора - пользователь должен иметь роль "admin" """
    import json
    import os
    log_path = r"c:\graph\hype\.cursor\debug.log"
    try:
        log_entry = {
            "location": "auth.py:97",
            "message": "get_current_admin called",
            "data": {
                "user_id": current_user.id,
                "username": current_user.username,
                "user_role": str(current_user.role),
                "expected_role": "admin",
                "role_match": current_user.role == models.UserRole.admin
            },
            "timestamp": int(__import__('time').time() * 1000),
            "sessionId": "debug-session",
            "runId": "initial",
            "hypothesisId": "A"
        }
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    except Exception:
        pass
    if current_user.role != models.UserRole.admin:
        try:
            log_entry = {
                "location": "auth.py:101",
                "message": "Admin role check failed",
                "data": {
                    "user_id": current_user.id,
                    "username": current_user.username,
                    "user_role": str(current_user.role),
                    "expected_role": "admin"
                },
                "timestamp": int(__import__('time').time() * 1000),
                "sessionId": "debug-session",
                "runId": "initial",
                "hypothesisId": "A"
            }
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    try:
        log_entry = {
            "location": "auth.py:106",
            "message": "Admin role check passed",
            "data": {
                "user_id": current_user.id,
                "username": current_user.username
            },
            "timestamp": int(__import__('time').time() * 1000),
            "sessionId": "debug-session",
            "runId": "initial",
            "hypothesisId": "A"
        }
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    except Exception:
        pass
    return current_user

