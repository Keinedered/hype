from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models
from pathlib import Path
import uuid
import shutil
from config import settings

router = APIRouter(prefix="/submissions")

def _submission_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR) / settings.SUBMISSION_UPLOAD_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _is_supported_upload(content_type: str | None) -> bool:
    return bool(content_type)


def _delete_submission_file(file_url: str) -> None:
    prefix = f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.SUBMISSION_UPLOAD_SUBDIR}/"
    if not file_url.startswith(prefix):
        return
    file_name = file_url.removeprefix(prefix)
    file_path = _submission_upload_dir() / file_name
    if file_path.exists() and file_path.is_file():
        file_path.unlink(missing_ok=True)


@router.post("/upload", response_model=schemas.SubmissionFileUploadResponse)
def upload_submission_file(
    file: UploadFile = File(...),
    _: models.User = Depends(get_current_active_user),
):
    if not _is_supported_upload(file.content_type):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    extension = Path(file.filename or "file").suffix.lower() or ".bin"
    file_name = f"{uuid.uuid4().hex}{extension}"
    upload_dir = _submission_upload_dir()
    destination = upload_dir / file_name

    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return schemas.SubmissionFileUploadResponse(
        file_url=f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.SUBMISSION_UPLOAD_SUBDIR}/{file_name}"
    )


@router.post("/upload/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission_upload(
    payload: schemas.SubmissionFileDeleteRequest,
    _: models.User = Depends(get_current_active_user),
):
    _delete_submission_file(payload.file_url)
    return None


@router.post("/", response_model=schemas.Submission)
def create_submission(
    submission: schemas.SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Создать новый submission"""
    try:
        return crud.create_submission(db, submission, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=List[schemas.UserSubmissionListItem])
def get_user_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получить все submissions текущего пользователя с деталями урока"""
    submissions = crud.get_user_submissions(db, current_user.id)
    result: list[schemas.UserSubmissionListItem] = []
    for submission in submissions:
        assignment = submission.assignment
        lesson = assignment.lesson if assignment else None
        module = lesson.module if lesson else None
        course = module.course if module else None
        track = course.track if course else None
        result.append(
            schemas.UserSubmissionListItem(
                id=submission.id,
                assignment_id=submission.assignment_id,
                version=submission.version,
                status=submission.status,
                curator_comment=submission.curator_comment,
                submitted_at=submission.submitted_at,
                reviewed_at=submission.reviewed_at,
                lesson_id=lesson.id if lesson else "",
                lesson_title=lesson.title if lesson else None,
                module_id=module.id if module else "",
                module_title=module.title if module else None,
                course_id=course.id if course else "",
                course_title=course.title if course else None,
                track_id=course.track_id if course else None,
                track_color=track.color if track else None,
            )
        )
    return result


@router.patch("/{submission_id}", response_model=schemas.Submission)
def update_submission(
    submission_id: str,
    submission_update: schemas.SubmissionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        updated = crud.update_submission(db, submission_id, submission_update, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(status_code=404, detail="Submission not found")
    return updated


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.user_id == current_user.id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    try:
        for file in submission.files:
            _delete_submission_file(file.file_url)
        deleted = crud.delete_submission(db, submission_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Submission not found")
