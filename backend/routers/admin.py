import secrets
import string
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_admin_user, get_password_hash
from config import settings
from database import get_db

router = APIRouter(prefix="/admin")


def _avatar_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR) / settings.AVATAR_UPLOAD_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _delete_avatar_file(avatar_url: str | None) -> None:
    if not avatar_url:
        return

    prefix = f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.AVATAR_UPLOAD_SUBDIR}/"
    if not avatar_url.startswith(prefix):
        return

    file_name = avatar_url.removeprefix(prefix)
    avatar_file = _avatar_upload_dir() / file_name
    if avatar_file.exists() and avatar_file.is_file():
        avatar_file.unlink(missing_ok=True)


def _generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/users", response_model=list[schemas.AdminUserListItem])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return users


@router.get("/users/{user_id}", response_model=schemas.AdminUserDetail)
def get_user_details(
    user_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return schemas.AdminUserDetail(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        hashed_password=user.hashed_password,
        submissions_count=len(user.submissions),
        notifications_count=len(user.notifications),
        user_courses_count=len(user.user_courses),
        user_lessons_count=len(user.user_lessons),
    )


@router.post("/users/{user_id}/reset-password", response_model=schemas.ResetPasswordResponse)
def reset_user_password(
    user_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temporary_password = _generate_temporary_password()
    user.hashed_password = get_password_hash(temporary_password)
    db.add(user)
    db.commit()

    return schemas.ResetPasswordResponse(
        user_id=user.id,
        username=user.username,
        temporary_password=temporary_password,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user),
):
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    _delete_avatar_file(user.avatar_url)
    db.delete(user)
    db.commit()
    return None
