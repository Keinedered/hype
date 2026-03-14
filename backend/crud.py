from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import models
import schemas
from auth import get_password_hash
import uuid


# Users
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ"""
    db_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Tracks
def get_tracks(db: Session) -> List[models.Track]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ñ‚Ñ€ÐµÐºÐ¸"""
    return db.query(models.Track).all()



def get_admin_tracks(db: Session) -> List[models.Track]:
    return db.query(models.Track).order_by(models.Track.id).all()


def get_admin_track(db: Session, track_id: str) -> Optional[models.Track]:
    return db.query(models.Track).filter(models.Track.id == track_id).first()


def create_admin_track(db: Session, track: schemas.AdminTrackCreate) -> models.Track:
    db_track = models.Track(
        id=track.id,
        name=track.name,
        description=track.description,
        color=track.color,
    )
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    return db_track


def update_admin_track(db: Session, track_id: str, track_update: schemas.AdminTrackUpdate) -> Optional[models.Track]:
    db_track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not db_track:
        return None

    data = track_update.dict(exclude_unset=True)
    if "name" in data:
        db_track.name = data["name"]
    if "description" in data:
        db_track.description = data["description"]
    if "color" in data:
        db_track.color = data["color"]

    db.commit()
    db.refresh(db_track)
    return db_track


def delete_admin_track(db: Session, track_id: str) -> bool:
    deleted_rows = db.query(models.Track).filter(models.Track.id == track_id).delete(synchronize_session=False)
    db.commit()
    return deleted_rows > 0


def get_track(db: Session, track_id: str) -> Optional[models.Track]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ñ‚Ñ€ÐµÐº Ð¿Ð¾ ID"""
    return db.query(models.Track).filter(models.Track.id == track_id).first()


# Courses
def get_courses(db: Session, track_id: Optional[str] = None, user_id: Optional[str] = None) -> List[dict]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ ÐºÑƒÑ€ÑÑ‹ Ñ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ¾Ð¼ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ"""
    query = db.query(models.Course).options(joinedload(models.Course.authors))

    if track_id:
        query = query.filter(models.Course.track_id == track_id)

    courses = query.all()

    # Ð•ÑÐ»Ð¸ user_id Ð¿ÐµÑ€ÐµÐ´Ð°Ð½, Ð´Ð¾Ð±Ð°Ð²Ð»ÑÐµÐ¼ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑ
    result = []
    for course in courses:
        course_dict = {
            "id": course.id,
            "track_id": course.track_id,
            "title": course.title,
            "version": course.version,
            "description": course.description,
            "short_description": course.short_description,
            "level": course.level.value if hasattr(course.level, 'value') else course.level,
            "module_count": course.module_count,
            "lesson_count": course.lesson_count,
            "task_count": course.task_count,
            "authors": [author.author_name for author in course.authors],
            "enrollment_deadline": course.enrollment_deadline,
            "created_at": course.created_at
        }

        if user_id:
            user_course = db.query(models.UserCourse).filter(
                models.UserCourse.user_id == user_id,
                models.UserCourse.course_id == course.id
            ).first()
            if user_course:
                course_dict["progress"] = user_course.progress
                course_dict["status"] = user_course.status.value if hasattr(user_course.status, 'value') else user_course.status
            else:
                course_dict["progress"] = None
                course_dict["status"] = "not_started"

        result.append(course_dict)

    return result


def get_course(db: Session, course_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÑƒÑ€Ñ Ð¿Ð¾ ID Ñ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ¾Ð¼"""
    course = db.query(models.Course).options(joinedload(models.Course.authors)).filter(
        models.Course.id == course_id
    ).first()

    if not course:
        return None

    course_dict = {
        "id": course.id,
        "track_id": course.track_id,
        "title": course.title,
        "version": course.version,
        "description": course.description,
        "short_description": course.short_description,
        "level": course.level.value if hasattr(course.level, 'value') else course.level,
        "module_count": course.module_count,
        "lesson_count": course.lesson_count,
        "task_count": course.task_count,
        "authors": [author.author_name for author in course.authors],
        "enrollment_deadline": course.enrollment_deadline,
        "created_at": course.created_at
    }

    if user_id:
        user_course = db.query(models.UserCourse).filter(
            models.UserCourse.user_id == user_id,
            models.UserCourse.course_id == course.id
        ).first()
        if user_course:
            course_dict["progress"] = user_course.progress
            course_dict["status"] = user_course.status.value if hasattr(user_course.status, 'value') else user_course.status

    return course_dict


# Modules
def get_modules(db: Session, course_id: str) -> List[models.Module]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ð¼Ð¾Ð´ÑƒÐ»Ð¸ ÐºÑƒÑ€ÑÐ°"""
    return db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).order_by(models.Module.order_index).all()


def get_module(db: Session, module_id: str) -> Optional[models.Module]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¼Ð¾Ð´ÑƒÐ»ÑŒ Ð¿Ð¾ ID"""
    return db.query(models.Module).filter(models.Module.id == module_id).first()


# Lessons
def get_lessons(db: Session, module_id: str) -> List[models.Lesson]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ ÑƒÑ€Ð¾ÐºÐ¸ Ð¼Ð¾Ð´ÑƒÐ»Ñ"""
    return db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id
    ).order_by(models.Lesson.order_index).all()


def get_lesson(db: Session, lesson_id: str) -> Optional[models.Lesson]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑƒÑ€Ð¾Ðº Ð¿Ð¾ ID"""
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id).first()


# Graph
def get_graph_nodes(db: Session, user_id: Optional[str] = None) -> List[models.GraphNode]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ ÑƒÐ·Ð»Ñ‹ Ð³Ñ€Ð°Ñ„Ð°"""
    return db.query(models.GraphNode).all()


def get_graph_edges(db: Session) -> List[models.GraphEdge]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ñ€ÐµÐ±Ñ€Ð° Ð³Ñ€Ð°Ñ„Ð°"""
    return db.query(models.GraphEdge).all()


# Submissions
def _validate_submission_payload(assignment: models.Assignment, submission: schemas.SubmissionCreate | schemas.SubmissionUpdate) -> None:
    requires_text = assignment.requires_text
    requires_link = assignment.requires_link
    requires_file = assignment.requires_file
    requires_any = assignment.requires_any

    has_text = bool(submission.text_answer and submission.text_answer.strip())
    has_link = bool(submission.link_url and submission.link_url.strip())
    has_files = bool(submission.file_urls)

    if requires_any:
        if requires_text or requires_link or requires_file:
            if not (has_text or has_link or has_files):
                raise ValueError("Submission does not satisfy assignment requirements.")
        return

    if requires_text and not has_text:
        raise ValueError("Text answer is required.")
    if requires_link and not has_link:
        raise ValueError("Link is required.")
    if requires_file and not has_files:
        raise ValueError("File is required.")


def create_submission(db: Session, submission: schemas.SubmissionCreate, user_id: str) -> models.Submission:
    """Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ submission"""
    assignment = db.query(models.Assignment).filter(models.Assignment.id == submission.assignment_id).first()
    if not assignment:
        raise ValueError("Assignment not found")
    _validate_submission_payload(assignment, submission)
    # ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ðµ submissions
    existing = db.query(models.Submission).filter(
        models.Submission.assignment_id == submission.assignment_id,
        models.Submission.user_id == user_id
    ).order_by(models.Submission.version.desc()).first()

    version = existing.version + 1 if existing else 1

    db_submission = models.Submission(
        id=str(uuid.uuid4()),
        assignment_id=submission.assignment_id,
        user_id=user_id,
        version=version,
        text_answer=submission.text_answer,
        link_url=submission.link_url,
        status=models.SubmissionStatus.pending,
        submitted_at=func.now()
    )
    db.add(db_submission)

    # Ð”Ð¾Ð±Ð°Ð²Ð»ÑÐµÐ¼ Ñ„Ð°Ð¹Ð»Ñ‹ ÐµÑÐ»Ð¸ ÐµÑÑ‚ÑŒ
    if submission.file_urls:
        for file_url in submission.file_urls:
            db_file = models.SubmissionFile(
                submission_id=db_submission.id,
                file_url=file_url
            )
            db.add(db_file)

    db.commit()
    db.refresh(db_submission)
    return db_submission


def update_submission(
    db: Session,
    submission_id: str,
    submission_update: schemas.SubmissionUpdate,
    user_id: str
) -> Optional[models.Submission]:
    db_submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.user_id == user_id,
    ).first()
    if not db_submission:
        return None

    assignment = db.query(models.Assignment).filter(models.Assignment.id == db_submission.assignment_id).first()
    if not assignment:
        return None

    if db_submission.status not in [models.SubmissionStatus.pending, models.SubmissionStatus.needs_revision]:
        raise ValueError("Submission cannot be edited in current status")

    _validate_submission_payload(assignment, submission_update)

    if db_submission.status == models.SubmissionStatus.needs_revision:
        existing = db.query(models.Submission).filter(
            models.Submission.assignment_id == db_submission.assignment_id,
            models.Submission.user_id == user_id
        ).order_by(models.Submission.version.desc()).first()
        version = existing.version + 1 if existing else 1

        new_submission = models.Submission(
            id=str(uuid.uuid4()),
            assignment_id=db_submission.assignment_id,
            user_id=user_id,
            version=version,
            text_answer=submission_update.text_answer,
            link_url=submission_update.link_url,
            status=models.SubmissionStatus.pending,
            submitted_at=func.now(),
        )
        db.add(new_submission)

        for file_url in submission_update.file_urls or []:
            db_file = models.SubmissionFile(
                submission_id=new_submission.id,
                file_url=file_url,
            )
            db.add(db_file)

        db.commit()
        db.refresh(new_submission)
        return new_submission

    if "text_answer" in submission_update.dict(exclude_unset=True):
        db_submission.text_answer = submission_update.text_answer
    if "link_url" in submission_update.dict(exclude_unset=True):
        db_submission.link_url = submission_update.link_url

    if "file_urls" in submission_update.dict(exclude_unset=True):
        db_submission.files.clear()
        for file_url in submission_update.file_urls or []:
            db_file = models.SubmissionFile(
                submission_id=db_submission.id,
                file_url=file_url,
            )
            db.add(db_file)

    db_submission.status = models.SubmissionStatus.pending
    db_submission.submitted_at = func.now()
    db_submission.reviewed_at = None

    db.commit()
    db.refresh(db_submission)
    return db_submission


def delete_submission(db: Session, submission_id: str, user_id: str) -> bool:
    db_submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.user_id == user_id,
    ).first()
    if not db_submission:
        return False
    if db_submission.status != models.SubmissionStatus.pending:
        raise ValueError("Only pending submissions can be deleted")
    db.delete(db_submission)
    db.commit()
    return True


def get_user_submissions(db: Session, user_id: str) -> List[models.Submission]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²ÑÐµ submissions Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ"""
    return db.query(models.Submission).filter(
        models.Submission.user_id == user_id
    ).order_by(models.Submission.created_at.desc()).all()


def get_admin_submissions(db: Session, course_ids: Optional[List[str]] = None) -> List[models.Submission]:
    query = db.query(models.Submission).options(
        joinedload(models.Submission.files),
        joinedload(models.Submission.user),
        joinedload(models.Submission.assignment)
        .joinedload(models.Assignment.lesson)
        .joinedload(models.Lesson.module),
    )
    if course_ids is not None:
        query = query.join(models.Assignment, models.Submission.assignment_id == models.Assignment.id)
        query = query.join(models.Lesson, models.Assignment.lesson_id == models.Lesson.id)
        query = query.join(models.Module, models.Lesson.module_id == models.Module.id)
        query = query.filter(models.Module.course_id.in_(course_ids))
    return query.order_by(models.Submission.created_at.desc()).all()


def get_submission_course_id(db: Session, submission_id: str) -> Optional[str]:
    result = db.query(models.Module.course_id).join(
        models.Lesson, models.Module.id == models.Lesson.module_id
    ).join(
        models.Assignment, models.Lesson.id == models.Assignment.lesson_id
    ).join(
        models.Submission, models.Assignment.id == models.Submission.assignment_id
    ).filter(models.Submission.id == submission_id).first()
    return result[0] if result else None


def review_submission(
    db: Session,
    submission_id: str,
    status: schemas.SubmissionStatus,
    curator_comment: Optional[str] = None,
) -> Optional[models.Submission]:
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not submission:
        return None
    submission.status = status
    submission.curator_comment = curator_comment
    submission.reviewed_at = func.now()
    db.commit()
    db.refresh(submission)
    return submission


# Notifications
def get_user_notifications(db: Session, user_id: str, unread_only: bool = False) -> List[models.Notification]:
    """ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ"""
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc()).all()


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Optional[models.Notification]:
    """ÐžÑ‚Ð¼ÐµÑ‚Ð¸Ñ‚ÑŒ ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ðµ ÐºÐ°Ðº Ð¿Ñ€Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½Ð½Ð¾Ðµ"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification


# User progress
def update_course_progress(db: Session, user_id: str, course_id: str, progress: float, status: str):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑ Ð¿Ð¾ ÐºÑƒÑ€ÑÑƒ"""
    user_course = db.query(models.UserCourse).filter(
        models.UserCourse.user_id == user_id,
        models.UserCourse.course_id == course_id
    ).first()

    if user_course:
        user_course.progress = progress
        user_course.status = status
        if status == "completed" and not user_course.completed_at:
            user_course.completed_at = func.now()
    else:
        user_course = models.UserCourse(
            user_id=user_id,
            course_id=course_id,
            progress=progress,
            status=status,
            started_at=func.now()
        )
        db.add(user_course)

    db.commit()
    return user_course


def update_lesson_progress(db: Session, user_id: str, lesson_id: str, status: str):
    """ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑ Ð¿Ð¾ ÑƒÑ€Ð¾ÐºÑƒ"""
    user_lesson = db.query(models.UserLesson).filter(
        models.UserLesson.user_id == user_id,
        models.UserLesson.lesson_id == lesson_id
    ).first()

    if user_lesson:
        user_lesson.status = status
        if status == "completed" and not user_lesson.completed_at:
            user_lesson.completed_at = func.now()
    else:
        user_lesson = models.UserLesson(
            user_id=user_id,
            lesson_id=lesson_id,
            status=status,
            completed_at=func.now() if status == "completed" else None
        )
        db.add(user_lesson)

    db.commit()
    return user_lesson


def _recalculate_course_counts(db: Session, course_id: str) -> None:
    module_count = db.query(models.Module).filter(models.Module.course_id == course_id).count()
    lesson_count = (
        db.query(models.Lesson)
        .join(models.Module, models.Lesson.module_id == models.Module.id)
        .filter(models.Module.course_id == course_id)
        .count()
    )
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if course:
        course.module_count = module_count
        course.lesson_count = lesson_count
        db.add(course)
        db.commit()


def get_admin_courses(db: Session) -> List[models.Course]:
    return db.query(models.Course).options(joinedload(models.Course.authors)).order_by(models.Course.created_at.desc()).all()


def get_course_editor_courses(db: Session, user_id: str) -> List[models.Course]:
    return (
        db.query(models.Course)
        .join(models.CourseEditor, models.Course.id == models.CourseEditor.course_id)
        .options(joinedload(models.Course.authors))
        .filter(models.CourseEditor.user_id == user_id)
        .order_by(models.Course.created_at.desc())
        .all()
    )


def get_course_editor_course_ids(db: Session, user_id: str) -> List[str]:
    rows = db.query(models.CourseEditor.course_id).filter(models.CourseEditor.user_id == user_id).all()
    return [row[0] for row in rows]


def user_can_edit_course(db: Session, user_id: str, course_id: str) -> bool:
    return (
        db.query(models.CourseEditor)
        .filter(models.CourseEditor.user_id == user_id, models.CourseEditor.course_id == course_id)
        .first()
        is not None
    )


def set_course_editor_courses(db: Session, user_id: str, course_ids: List[str]) -> None:
    unique_ids = sorted(set(course_ids))
    if unique_ids:
        existing_ids = {
            row[0]
            for row in db.query(models.Course.id).filter(models.Course.id.in_(unique_ids)).all()
        }
        missing = sorted(set(unique_ids) - existing_ids)
        if missing:
            raise ValueError(f"Courses not found: {', '.join(missing)}")

    db.query(models.CourseEditor).filter(models.CourseEditor.user_id == user_id).delete(synchronize_session=False)
    for course_id in unique_ids:
        db.add(models.CourseEditor(user_id=user_id, course_id=course_id))
    db.commit()


def assign_course_editor_course(db: Session, user_id: str, course_id: str) -> None:
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise ValueError(f"Course not found: {course_id}")

    exists = (
        db.query(models.CourseEditor)
        .filter(models.CourseEditor.user_id == user_id, models.CourseEditor.course_id == course_id)
        .first()
    )
    if exists:
        return

    db.add(models.CourseEditor(user_id=user_id, course_id=course_id))
    db.commit()


def get_admin_course(db: Session, course_id: str) -> Optional[models.Course]:
    return db.query(models.Course).options(joinedload(models.Course.authors)).filter(models.Course.id == course_id).first()


def create_admin_course(db: Session, course: schemas.AdminCourseCreate) -> models.Course:
    db_course = models.Course(
        id=course.id,
        track_id=course.track_id,
        title=course.title,
        version=course.version,
        description=course.description,
        short_description=course.short_description,
        level=course.level,
        module_count=0,
        lesson_count=0,
        task_count=course.task_count,
        enrollment_deadline=course.enrollment_deadline,
    )
    db.add(db_course)
    db.flush()

    for author_name in course.authors:
        db.add(models.CourseAuthor(course_id=db_course.id, author_name=author_name))

    db.commit()
    db.refresh(db_course)
    return db_course


def update_admin_course(db: Session, course_id: str, course_update: schemas.AdminCourseUpdate) -> Optional[models.Course]:
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        return None

    data = course_update.dict(exclude_unset=True)

    if "track_id" in data:
        db_course.track_id = data["track_id"]
    if "title" in data:
        db_course.title = data["title"]
    if "version" in data:
        db_course.version = data["version"]
    if "description" in data:
        db_course.description = data["description"]
    if "short_description" in data:
        db_course.short_description = data["short_description"]
    if "level" in data:
        db_course.level = data["level"]
    if "task_count" in data:
        db_course.task_count = data["task_count"]
    if "enrollment_deadline" in data:
        db_course.enrollment_deadline = data["enrollment_deadline"]

    if "authors" in data:
        db.query(models.CourseAuthor).filter(models.CourseAuthor.course_id == course_id).delete(synchronize_session=False)
        for author_name in data["authors"] or []:
            db.add(models.CourseAuthor(course_id=course_id, author_name=author_name))

    db.commit()
    db.refresh(db_course)
    return db_course


def delete_admin_course(db: Session, course_id: str) -> bool:
    deleted_rows = db.query(models.Course).filter(models.Course.id == course_id).delete(synchronize_session=False)
    db.commit()
    return deleted_rows > 0


def get_admin_modules(db: Session, course_id: str) -> List[models.Module]:
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order_index).all()


def get_admin_module(db: Session, module_id: str) -> Optional[models.Module]:
    return db.query(models.Module).filter(models.Module.id == module_id).first()


def create_admin_module(db: Session, module: schemas.AdminModuleCreate) -> models.Module:
    db_module = models.Module(
        id=module.id,
        course_id=module.course_id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
    )
    db.add(db_module)
    db.commit()
    _recalculate_course_counts(db, module.course_id)
    db.refresh(db_module)
    return db_module


def update_admin_module(db: Session, module_id: str, module_update: schemas.AdminModuleUpdate) -> Optional[models.Module]:
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        return None

    old_course_id = db_module.course_id

    data = module_update.dict(exclude_unset=True)

    if "course_id" in data:
        db_module.course_id = data["course_id"]
    if "title" in data:
        db_module.title = data["title"]
    if "description" in data:
        db_module.description = data["description"]
    if "order_index" in data:
        db_module.order_index = data["order_index"]

    db.commit()
    db.refresh(db_module)
    _recalculate_course_counts(db, old_course_id)
    if db_module.course_id != old_course_id:
        _recalculate_course_counts(db, db_module.course_id)
    return db_module


def delete_admin_module(db: Session, module_id: str) -> bool:
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        return False

    course_id = db_module.course_id
    deleted_rows = db.query(models.Module).filter(models.Module.id == module_id).delete(synchronize_session=False)
    db.commit()
    if deleted_rows:
        _recalculate_course_counts(db, course_id)
    return deleted_rows > 0


def get_admin_lessons(db: Session, module_id: str) -> List[models.Lesson]:
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).order_by(models.Lesson.order_index).all()


def get_admin_lesson(db: Session, lesson_id: str) -> Optional[models.Lesson]:
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id).first()


def create_admin_lesson(db: Session, lesson: schemas.AdminLessonCreate) -> models.Lesson:
    db_lesson = models.Lesson(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        description=lesson.description,
        video_url=lesson.video_url,
        video_duration=lesson.video_duration,
        content=lesson.content,
        order_index=lesson.order_index,
    )
    db.add(db_lesson)

    if lesson.assignment:
        assignment_id = lesson.assignment.id or str(uuid.uuid4())
        db_assignment = models.Assignment(
            id=assignment_id,
            lesson_id=db_lesson.id,
            description=lesson.assignment.description or "",
            criteria=lesson.assignment.criteria or "",
            requires_text=lesson.assignment.requires_text,
            requires_file=lesson.assignment.requires_file,
            requires_link=lesson.assignment.requires_link,
            requires_any=lesson.assignment.requires_any,
        )
        db.add(db_assignment)
        db_lesson.assignment = db_assignment

    db.commit()

    module = db.query(models.Module).filter(models.Module.id == lesson.module_id).first()
    if module:
        _recalculate_course_counts(db, module.course_id)
    db.refresh(db_lesson)
    return db_lesson


def update_admin_lesson(db: Session, lesson_id: str, lesson_update: schemas.AdminLessonUpdate) -> Optional[models.Lesson]:
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        return None

    old_module_id = db_lesson.module_id

    data = lesson_update.dict(exclude_unset=True)
    assignment_present = "assignment" in data
    assignment_data = data.pop("assignment", None) if assignment_present else None

    if "module_id" in data:
        db_lesson.module_id = data["module_id"]
    if "title" in data:
        db_lesson.title = data["title"]
    if "description" in data:
        db_lesson.description = data["description"]
    if "video_url" in data:
        db_lesson.video_url = data["video_url"]
    if "video_duration" in data:
        db_lesson.video_duration = data["video_duration"]
    if "content" in data:
        db_lesson.content = data["content"]
    if "order_index" in data:
        db_lesson.order_index = data["order_index"]

    if assignment_present:
        if assignment_data is None:
            if db_lesson.assignment:
                db.delete(db_lesson.assignment)
                db_lesson.assignment = None
        else:
            if db_lesson.assignment:
                if "description" in assignment_data:
                    db_lesson.assignment.description = assignment_data.get("description") or ""
                if "criteria" in assignment_data:
                    db_lesson.assignment.criteria = assignment_data.get("criteria") or ""
                if "requires_text" in assignment_data:
                    db_lesson.assignment.requires_text = assignment_data["requires_text"]
                if "requires_file" in assignment_data:
                    db_lesson.assignment.requires_file = assignment_data["requires_file"]
                if "requires_link" in assignment_data:
                    db_lesson.assignment.requires_link = assignment_data["requires_link"]
                if "requires_any" in assignment_data:
                    db_lesson.assignment.requires_any = assignment_data["requires_any"]
            else:
                assignment_id = assignment_data.get("id") or str(uuid.uuid4())
                db_assignment = models.Assignment(
                    id=assignment_id,
                    lesson_id=db_lesson.id,
                    description=assignment_data.get("description") or "",
                    criteria=assignment_data.get("criteria") or "",
                    requires_text=assignment_data.get("requires_text", False),
                    requires_file=assignment_data.get("requires_file", False),
                    requires_link=assignment_data.get("requires_link", False),
                    requires_any=assignment_data.get("requires_any", False),
                )
                db.add(db_assignment)
                db_lesson.assignment = db_assignment

    db.commit()
    db.refresh(db_lesson)

    old_module = db.query(models.Module).filter(models.Module.id == old_module_id).first()
    if old_module:
        _recalculate_course_counts(db, old_module.course_id)
    if db_lesson.module_id != old_module_id:
        new_module = db.query(models.Module).filter(models.Module.id == db_lesson.module_id).first()
        if new_module:
            _recalculate_course_counts(db, new_module.course_id)

    return db_lesson


def delete_admin_lesson(db: Session, lesson_id: str) -> bool:
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        return False

    module_id = db_lesson.module_id
    deleted_rows = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).delete(synchronize_session=False)
    db.commit()
    if deleted_rows:
        module = db.query(models.Module).filter(models.Module.id == module_id).first()
        if module:
            _recalculate_course_counts(db, module.course_id)
    return deleted_rows > 0


def update_user(db: Session, user_id: str, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user profile fields"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None

    if user_update.email is not None:
        db_user.email = user_update.email
    if user_update.username is not None:
        db_user.username = user_update.username
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name

    db.commit()
    db.refresh(db_user)
    return db_user


def update_admin_user(db: Session, user_id: str, user_update: schemas.AdminUserUpdate) -> Optional[models.User]:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None

    data = user_update.dict(exclude_unset=True)
    if "email" in data:
        db_user.email = data["email"]
    if "username" in data:
        db_user.username = data["username"]
    if "full_name" in data:
        db_user.full_name = data["full_name"]
    if "role" in data:
        db_user.role = data["role"]
    if "is_active" in data:
        db_user.is_active = data["is_active"]
    if "editable_course_ids" in data:
        set_course_editor_courses(db, user_id, data["editable_course_ids"] or [])
    if "course_creation_allowed" in data:
        db_user.course_creation_allowed = data["course_creation_allowed"]

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: str) -> bool:
    """Delete user by id using SQL DELETE so DB cascades handle children."""
    deleted_rows = db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)
    db.commit()
    return deleted_rows > 0
