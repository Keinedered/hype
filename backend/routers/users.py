import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_active_user
from config import settings
from database import get_db

router = APIRouter(prefix="/users")


def _avatar_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR) / settings.AVATAR_UPLOAD_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _is_supported_image(content_type: str | None) -> bool:
    return bool(content_type and content_type.startswith("image/"))


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


@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=schemas.User)
def update_current_user_info(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
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


@router.post("/me/avatar", response_model=schemas.User)
def upload_my_avatar(
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if not _is_supported_image(avatar.content_type):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")

    extension = Path(avatar.filename or "avatar").suffix.lower() or ".jpg"
    file_name = f"{current_user.id}_{uuid.uuid4().hex}{extension}"
    upload_dir = _avatar_upload_dir()
    destination = upload_dir / file_name

    with destination.open("wb") as buffer:
        shutil.copyfileobj(avatar.file, buffer)

    _delete_avatar_file(current_user.avatar_url)
    current_user.avatar_url = f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.AVATAR_UPLOAD_SUBDIR}/{file_name}"

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=schemas.User)
def delete_my_avatar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _delete_avatar_file(current_user.avatar_url)
    current_user.avatar_url = None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _delete_avatar_file(current_user.avatar_url)

    deleted = crud.delete_user(db, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")

    return None

