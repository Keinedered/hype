import secrets
import shutil
import string
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

import crud
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


def _video_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR) / settings.VIDEO_UPLOAD_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _is_supported_video(content_type: str | None) -> bool:
    return bool(content_type and content_type.startswith("video/"))


def _delete_video_file(video_url: str | None) -> None:
    if not video_url:
        return

    prefix = f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.VIDEO_UPLOAD_SUBDIR}/"
    if not video_url.startswith(prefix):
        return

    file_name = video_url.removeprefix(prefix)
    video_file = _video_upload_dir() / file_name
    if video_file.exists() and video_file.is_file():
        video_file.unlink(missing_ok=True)


def _generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _serialize_admin_lesson(lesson: models.Lesson) -> schemas.AdminLessonDetail:
    return schemas.AdminLessonDetail(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        description=lesson.description,
        video_url=lesson.video_url,
        video_duration=lesson.video_duration,
        content=lesson.content,
        order_index=lesson.order_index,
        assignment=(
            schemas.AdminAssignmentDetail(
                id=lesson.assignment.id,
                lesson_id=lesson.assignment.lesson_id,
                description=lesson.assignment.description or "",
                criteria=lesson.assignment.criteria or "",
                requires_text=lesson.assignment.requires_text,
                requires_file=lesson.assignment.requires_file,
                requires_link=lesson.assignment.requires_link,
                requires_any=lesson.assignment.requires_any,
            )
            if lesson.assignment
            else None
        ),
    )


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
    deleted = crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")

    return None


@router.get("/tracks", response_model=list[schemas.AdminTrackDetail])
def list_tracks(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    return crud.get_admin_tracks(db)


@router.post("/tracks", response_model=schemas.AdminTrackDetail, status_code=status.HTTP_201_CREATED)
def create_track(
    track: schemas.AdminTrackCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    existing = crud.get_admin_track(db, track.id)
    if existing:
        raise HTTPException(status_code=400, detail="Track already exists")
    return crud.create_admin_track(db, track)


@router.patch("/tracks/{track_id}", response_model=schemas.AdminTrackDetail)
def update_track(
    track_id: str,
    track_update: schemas.AdminTrackUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    updated = crud.update_admin_track(db, track_id, track_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Track not found")
    return updated


@router.delete("/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_track(
    track_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    courses_count = db.query(models.Course).filter(models.Course.track_id == track_id).count()
    if courses_count > 0:
        raise HTTPException(status_code=400, detail="Track has courses")
    deleted = crud.delete_admin_track(db, track_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Track not found")
    return None


@router.get("/courses", response_model=list[schemas.AdminCourseListItem])
def list_courses(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    courses = crud.get_admin_courses(db)
    result = []
    for course in courses:
        result.append(
            schemas.AdminCourseListItem(
                id=course.id,
                track_id=course.track_id,
                title=course.title,
                version=course.version,
                level=course.level,
                module_count=course.module_count,
                lesson_count=course.lesson_count,
                task_count=course.task_count,
            )
        )
    return result


@router.get("/courses/{course_id}", response_model=schemas.AdminCourseDetail)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    course = crud.get_admin_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return schemas.AdminCourseDetail(
        id=course.id,
        track_id=course.track_id,
        title=course.title,
        version=course.version,
        description=course.description,
        short_description=course.short_description,
        level=course.level,
        module_count=course.module_count,
        lesson_count=course.lesson_count,
        task_count=course.task_count,
        authors=[author.author_name for author in course.authors],
        enrollment_deadline=course.enrollment_deadline,
        created_at=course.created_at,
    )


@router.post("/courses", response_model=schemas.AdminCourseDetail, status_code=status.HTTP_201_CREATED)
def create_course(
    course: schemas.AdminCourseCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    existing = crud.get_admin_course(db, course.id)
    if existing:
        raise HTTPException(status_code=400, detail="Course already exists")
    created = crud.create_admin_course(db, course)
    return schemas.AdminCourseDetail(
        id=created.id,
        track_id=created.track_id,
        title=created.title,
        version=created.version,
        description=created.description,
        short_description=created.short_description,
        level=created.level,
        module_count=created.module_count,
        lesson_count=created.lesson_count,
        task_count=created.task_count,
        authors=[author.author_name for author in created.authors],
        enrollment_deadline=created.enrollment_deadline,
        created_at=created.created_at,
    )


@router.patch("/courses/{course_id}", response_model=schemas.AdminCourseDetail)
def update_course(
    course_id: str,
    course_update: schemas.AdminCourseUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    updated = crud.update_admin_course(db, course_id, course_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Course not found")
    updated = crud.get_admin_course(db, course_id)
    return schemas.AdminCourseDetail(
        id=updated.id,
        track_id=updated.track_id,
        title=updated.title,
        version=updated.version,
        description=updated.description,
        short_description=updated.short_description,
        level=updated.level,
        module_count=updated.module_count,
        lesson_count=updated.lesson_count,
        task_count=updated.task_count,
        authors=[author.author_name for author in updated.authors],
        enrollment_deadline=updated.enrollment_deadline,
        created_at=updated.created_at,
    )


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    deleted = crud.delete_admin_course(db, course_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    return None


@router.get("/courses/{course_id}/modules", response_model=list[schemas.AdminModuleListItem])
def list_modules(
    course_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    modules = crud.get_admin_modules(db, course_id)
    return [
        schemas.AdminModuleListItem(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            description=module.description,
            order_index=module.order_index,
            lesson_count=len(module.lessons),
        )
        for module in modules
    ]


@router.get("/modules/{module_id}", response_model=schemas.AdminModuleDetail)
def get_module(
    module_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    module = crud.get_admin_module(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return schemas.AdminModuleDetail(
        id=module.id,
        course_id=module.course_id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
    )


@router.post("/modules", response_model=schemas.AdminModuleDetail, status_code=status.HTTP_201_CREATED)
def create_module(
    module: schemas.AdminModuleCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    existing = crud.get_admin_module(db, module.id)
    if existing:
        raise HTTPException(status_code=400, detail="Module already exists")
    created = crud.create_admin_module(db, module)
    return schemas.AdminModuleDetail(
        id=created.id,
        course_id=created.course_id,
        title=created.title,
        description=created.description,
        order_index=created.order_index,
    )


@router.patch("/modules/{module_id}", response_model=schemas.AdminModuleDetail)
def update_module(
    module_id: str,
    module_update: schemas.AdminModuleUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    updated = crud.update_admin_module(db, module_id, module_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Module not found")
    return schemas.AdminModuleDetail(
        id=updated.id,
        course_id=updated.course_id,
        title=updated.title,
        description=updated.description,
        order_index=updated.order_index,
    )


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    deleted = crud.delete_admin_module(db, module_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Module not found")
    return None


@router.get("/modules/{module_id}/lessons", response_model=list[schemas.AdminLessonListItem])
def list_lessons(
    module_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    lessons = crud.get_admin_lessons(db, module_id)
    return [
        schemas.AdminLessonListItem(
            id=lesson.id,
            module_id=lesson.module_id,
            title=lesson.title,
            description=lesson.description,
            order_index=lesson.order_index,
        )
        for lesson in lessons
    ]


@router.get("/lessons/{lesson_id}", response_model=schemas.AdminLessonDetail)
def get_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    lesson = crud.get_admin_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return _serialize_admin_lesson(lesson)


@router.post("/lessons", response_model=schemas.AdminLessonDetail, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson: schemas.AdminLessonCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    existing = crud.get_admin_lesson(db, lesson.id)
    if existing:
        raise HTTPException(status_code=400, detail="Lesson already exists")
    created = crud.create_admin_lesson(db, lesson)
    return _serialize_admin_lesson(created)


@router.patch("/lessons/{lesson_id}", response_model=schemas.AdminLessonDetail)
def update_lesson(
    lesson_id: str,
    lesson_update: schemas.AdminLessonUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    existing = crud.get_admin_lesson(db, lesson_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Lesson not found")

    previous_video_url = existing.video_url
    requested_update = lesson_update.dict(exclude_unset=True)
    updated = crud.update_admin_lesson(db, lesson_id, lesson_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if "video_url" in requested_update and previous_video_url != updated.video_url:
        _delete_video_file(previous_video_url)

    return _serialize_admin_lesson(updated)


@router.post("/lessons/{lesson_id}/video", response_model=schemas.AdminLessonDetail)
def upload_lesson_video(
    lesson_id: str,
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    if not _is_supported_video(video.content_type):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only video files are allowed")

    lesson = crud.get_admin_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    extension = Path(video.filename or "video").suffix.lower() or ".mp4"
    safe_lesson_id = "".join(char if char.isalnum() or char in "-_" else "_" for char in lesson_id)
    file_name = f"{safe_lesson_id}_{uuid.uuid4().hex}{extension}"
    upload_dir = _video_upload_dir()
    destination = upload_dir / file_name

    with destination.open("wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    _delete_video_file(lesson.video_url)
    lesson.video_url = f"{settings.PUBLIC_UPLOADS_URL_PREFIX}/{settings.VIDEO_UPLOAD_SUBDIR}/{file_name}"

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _serialize_admin_lesson(lesson)


@router.delete("/lessons/{lesson_id}/video", response_model=schemas.AdminLessonDetail)
def delete_lesson_video(
    lesson_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    lesson = crud.get_admin_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    _delete_video_file(lesson.video_url)
    lesson.video_url = None

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _serialize_admin_lesson(lesson)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    lesson = crud.get_admin_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    _delete_video_file(lesson.video_url)
    deleted = crud.delete_admin_lesson(db, lesson_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return None


@router.get("/submissions", response_model=list[schemas.AdminSubmissionListItem])
def list_submissions(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    submissions = crud.get_admin_submissions(db)
    response: list[schemas.AdminSubmissionListItem] = []
    for submission in submissions:
        assignment = submission.assignment
        response.append(
            schemas.AdminSubmissionListItem(
                id=submission.id,
                assignment_id=submission.assignment_id,
                user_id=submission.user_id,
                username=submission.user.username if submission.user else "unknown",
                lesson_id=assignment.lesson_id if assignment else "",
                version=submission.version,
                text_answer=submission.text_answer,
                link_url=submission.link_url,
                file_urls=submission.file_urls,
                status=submission.status,
                curator_comment=submission.curator_comment,
                submitted_at=submission.submitted_at,
                reviewed_at=submission.reviewed_at,
            )
        )
    return response


@router.post("/submissions/{submission_id}/review", response_model=schemas.Submission)
def review_submission(
    submission_id: str,
    review: schemas.AdminSubmissionReview,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    updated = crud.review_submission(db, submission_id, review.status, review.curator_comment)
    if not updated:
        raise HTTPException(status_code=404, detail="Submission not found")
    return updated
