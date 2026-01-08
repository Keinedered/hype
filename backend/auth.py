from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings
import uuid
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
http_bearer = HTTPBearer(auto_error=False)


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


def create_refresh_token_hash(token_string: str) -> str:
    """Хеширование refresh токена для безопасного хранения"""
    return hashlib.sha256(token_string.encode()).hexdigest()


def create_refresh_token(user_id: str, db: Session, expires_days: int = 7) -> str:
    """Создание refresh токена и сохранение в БД"""
    # Генерируем уникальный токен
    token_string = str(uuid.uuid4())
    token_hash = create_refresh_token_hash(token_string)
    
    # Сохраняем хеш в БД (для безопасности не храним сам токен)
    refresh_token_db = models.RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=expires_days),
        is_revoked=False
    )
    db.add(refresh_token_db)
    db.commit()
    
    return token_string


def verify_refresh_token(token_string: str, db: Session) -> Optional[models.RefreshToken]:
    """Проверка refresh токена"""
    token_hash = create_refresh_token_hash(token_string)
    
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
        models.RefreshToken.is_revoked == False,
        models.RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    return refresh_token


def revoke_refresh_token(token_string: str, db: Session) -> bool:
    """Отозвать refresh токен (logout)"""
    token_hash = create_refresh_token_hash(token_string)
    
    refresh_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash
    ).first()
    
    if refresh_token:
        refresh_token.is_revoked = True
        db.commit()
        return True
    return False


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


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Опционально получить текущего пользователя из токена (не выбрасывает исключение если токена нет)"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = schemas.TokenData(username=username)
        user = get_user_by_username(db, username=token_data.username)
        return user if user and user.is_active else None
    except (JWTError, HTTPException, Exception):
        return None



async def get_current_admin(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Проверка прав администратора - пользователь должен иметь роль "admin" """
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

