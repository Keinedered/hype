import logging
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from database import get_db
import models
import schemas
import crud
from auth import get_current_admin
from datetime import datetime
from routers.utils import update_course_module_count, update_course_lesson_count, safe_commit

logger = logging.getLogger(__name__)

router = APIRouter()


def course_to_schema(course: models.Course) -> schemas.Course:
    """Преобразует модель Course в схему Course с правильной обработкой authors"""
    return schemas.Course(
        id=course.id,
        track_id=course.track_id,
        title=course.title,
        version=course.version or '',
        description=course.description or '',
        short_description=course.short_description or '',
        level=course.level,
        module_count=course.module_count or 0,
        lesson_count=course.lesson_count or 0,
        task_count=course.task_count or 0,
        authors=[author.author_name for author in course.authors] if course.authors else [],
        enrollment_deadline=course.enrollment_deadline,
        created_at=course.created_at,
        status=course.status or 'draft'
    )


# ==================== TRACKS ====================

@router.post('/admin/tracks', response_model=schemas.Track, status_code=status.HTTP_201_CREATED)
def create_track(
    track: schemas.TrackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый трек"""
    db_track = db.query(models.Track).filter(models.Track.id == track.id).first()
    if db_track:
        raise HTTPException(status_code=400, detail='Track already exists')
    
    new_track = models.Track(**track.dict())
    db.add(new_track)
    db.commit()
    db.refresh(new_track)
    return new_track


@router.get('/admin/tracks', response_model=List[schemas.Track])
def list_tracks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех треков"""
    return db.query(models.Track).all()


@router.put('/admin/tracks/{track_id}', response_model=schemas.Track)
def update_track(
    track_id: str,
    track: schemas.TrackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить трек"""
    db_track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not db_track:
        raise HTTPException(status_code=404, detail='Track not found')
    
    for key, value in track.dict().items():
        setattr(db_track, key, value)
    
    db.commit()
    db.refresh(db_track)
    return db_track


@router.delete('/admin/tracks/{track_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_track(
    track_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить трек"""
    db_track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not db_track:
        raise HTTPException(status_code=404, detail='Track not found')
    
    db.delete(db_track)
    db.commit()
    return None


# ==================== COURSES ====================

@router.post('/admin/courses', response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
def create_course(
    course: schemas.CourseCreate,
    create_graph_node: bool = Query(True, description="Автоматически создать узел графа"),
    x: float = Query(0.0, description="Координата X узла графа"),
    y: float = Query(0.0, description="Координата Y узла графа"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый курс"""
    db_course = db.query(models.Course).filter(models.Course.id == course.id).first()
    if db_course:
        raise HTTPException(status_code=400, detail='Course already exists')
    
    course_data = course.dict()
    authors = course_data.pop('authors', [])
    
    new_course = models.Course(
        **course_data,
        created_by_id=current_user.id,
        status='draft'
    )
    db.add(new_course)
    db.flush()  # Получить ID курса
    
    # Добавляем авторов
    for author_name in authors:
        author = models.CourseAuthor(
            course_id=new_course.id,
            author_name=author_name
        )
        db.add(author)
    
    # Автоматически создать узел графа, если указано
    if create_graph_node:
        try:
            crud.create_graph_node_for_course(db, new_course, x=x, y=y)
        except Exception as e:
            logger.warning(f"Failed to create graph node for course {new_course.id}: {e}", exc_info=True)
    
    safe_commit(db, "create_course")
    # Перезагружаем курс с авторами
    db.refresh(new_course)
    new_course = db.query(models.Course).options(joinedload(models.Course.authors)).filter(models.Course.id == new_course.id).first()
    return course_to_schema(new_course)


@router.get('/admin/courses', response_model=List[schemas.Course])
def list_courses(
    status: Optional[str] = Query(None, description="Filter by course status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех курсов"""
    query = db.query(models.Course).options(joinedload(models.Course.authors))
    if status:
        query = query.filter(models.Course.status == status)
    courses = query.all()
    return [course_to_schema(course) for course in courses]


@router.get('/admin/courses/{course_id}', response_model=schemas.Course)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить курс по ID"""
    course = db.query(models.Course).options(joinedload(models.Course.authors)).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    return course_to_schema(course)


@router.put('/admin/courses/{course_id}', response_model=schemas.Course)
def update_course(
    course_id: str,
    course: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить курс"""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail='Course not found')
    
    update_data = course.dict(exclude_unset=True)
    authors = update_data.pop('authors', None)
    
    # Обновляем поля курса
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    # Обновляем авторов, если они переданы
    if authors is not None:
        # Удаляем старых авторов
        db.query(models.CourseAuthor).filter(models.CourseAuthor.course_id == course_id).delete()
        # Добавляем новых
        for author_name in authors:
            author = models.CourseAuthor(
                course_id=course_id,
                author_name=author_name
            )
            db.add(author)
    
    db_course.updated_at = datetime.now()
    safe_commit(db, "update_course")
    # Перезагружаем курс с авторами
    db_course = db.query(models.Course).options(joinedload(models.Course.authors)).filter(models.Course.id == course_id).first()
    return course_to_schema(db_course)


@router.post('/admin/courses/{course_id}/publish')
def publish_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Опубликовать курс"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    
    course.status = 'published'
    course.published_at = datetime.now()
    safe_commit(db, "publish_course")
    return {'message': 'Course published successfully'}


@router.delete('/admin/courses/{course_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить курс"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    
    db.delete(course)
    safe_commit(db, "delete_course")
    return None


# ==================== MODULES ====================

@router.post('/admin/modules', response_model=schemas.Module, status_code=status.HTTP_201_CREATED)
def create_module(
    module: schemas.ModuleCreate,
    create_graph_node: bool = Query(True, description="Автоматически создать узел графа"),
    x: float = Query(0.0, description="Координата X узла графа"),
    y: float = Query(0.0, description="Координата Y узла графа"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый модуль"""
    # Проверка существования курса
    course = db.query(models.Course).filter(models.Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail='Course not found')
    
    # Проверка уникальности ID модуля
    existing_module = db.query(models.Module).filter(models.Module.id == module.id).first()
    if existing_module:
        raise HTTPException(status_code=400, detail='Module with this ID already exists')
    
    new_module = models.Module(**module.dict())
    db.add(new_module)
    db.flush()  # Получить ID модуля
    
    # Обновить счетчик модулей в курсе
    update_course_module_count(db, module.course_id)
    
    # Автоматически создать узел графа, если указано
    if create_graph_node:
        try:
            crud.create_graph_node_for_module(db, new_module, x=x, y=y, auto_create_edge=True)
        except Exception as e:
            logger.warning(f"Failed to create graph node for module {new_module.id}: {e}", exc_info=True)
    
    safe_commit(db, "create_module")
    db.refresh(new_module)
    # Перезагружаем с selectinload для правильной сериализации
    new_module = db.query(models.Module).options(
        selectinload(models.Module.lessons)
    ).filter(models.Module.id == new_module.id).first()
    return new_module


@router.get('/admin/modules', response_model=List[schemas.Module])
def list_modules(
    course_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список модулей"""
    # Оптимизированная загрузка: используем selectinload для lessons
    query = db.query(models.Module).options(
        selectinload(models.Module.lessons)
    )
    if course_id:
        query = query.filter(models.Module.course_id == course_id)
    modules = query.order_by(models.Module.order_index).all()
    
    # Предзагружаем связанные данные для уроков одним запросом (избегаем N+1)
    lesson_ids = [lesson.id for module in modules for lesson in module.lessons]
    if lesson_ids:
        # Загружаем handbook_excerpts и assignments для всех уроков одним запросом
        db.query(models.Lesson).filter(models.Lesson.id.in_(lesson_ids)).options(
            joinedload(models.Lesson.handbook_excerpts),
            joinedload(models.Lesson.assignment)
        ).all()
    
    return modules


@router.get('/admin/modules/{module_id}', response_model=schemas.Module)
def get_module(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить модуль по ID"""
    module = db.query(models.Module).options(
        selectinload(models.Module.lessons)
    ).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail='Module not found')
    
    # Предзагружаем связанные данные для уроков модуля
    if module.lessons:
        lesson_ids = [lesson.id for lesson in module.lessons]
        db.query(models.Lesson).filter(models.Lesson.id.in_(lesson_ids)).options(
            joinedload(models.Lesson.handbook_excerpts),
            joinedload(models.Lesson.assignment)
        ).all()
    
    return module


@router.put('/admin/modules/{module_id}', response_model=schemas.Module)
def update_module(
    module_id: str,
    module: schemas.ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить модуль"""
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail='Module not found')
    
    update_data = module.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_module, key, value)
    
    safe_commit(db, "update_module")
    db.refresh(db_module)
    # Перезагружаем с selectinload для правильной сериализации
    db_module = db.query(models.Module).options(
        selectinload(models.Module.lessons)
    ).filter(models.Module.id == module_id).first()
    
    # Предзагружаем связанные данные для уроков
    if db_module and db_module.lessons:
        lesson_ids = [lesson.id for lesson in db_module.lessons]
        db.query(models.Lesson).filter(models.Lesson.id.in_(lesson_ids)).options(
            joinedload(models.Lesson.handbook_excerpts),
            joinedload(models.Lesson.assignment)
        ).all()
    
    return db_module


@router.delete('/admin/modules/{module_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить модуль"""
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail='Module not found')
    
    course_id = module.course_id
    
    # Освобождаем уроки (устанавливаем module_id = NULL)
    # Это делается автоматически через ondelete="SET NULL", но лучше сделать явно
    lessons = db.query(models.Lesson).filter(models.Lesson.module_id == module_id).all()
    for lesson in lessons:
        lesson.module_id = None
    
    # Удаляем узел графа модуля
    try:
        crud.delete_graph_node_for_module(db, module_id)
    except Exception as e:
        logger.warning(f"Failed to delete graph node for module {module_id}: {e}", exc_info=True)
    
    # Удаляем модуль (Handbook удалится автоматически через CASCADE)
    db.delete(module)
    safe_commit(db, "delete_module")
    
    # Обновить счетчик модулей в курсе
    update_course_module_count(db, course_id)
    safe_commit(db, "update_course_module_count")
    
    # Обновить счетчик уроков в курсе (так как уроки были освобождены)
    update_course_lesson_count(db, course_id)
    safe_commit(db, "update_course_lesson_count")
    
    return None


# ==================== LESSONS ====================

@router.post('/admin/lessons', response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson: schemas.LessonCreate,
    create_graph_node: bool = Query(True, description="Автоматически создать узел графа"),
    x: float = Query(0.0, description="Координата X узла графа"),
    y: float = Query(0.0, description="Координата Y узла графа"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый урок"""
    # Проверка уникальности ID урока
    existing_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson.id).first()
    if existing_lesson:
        raise HTTPException(status_code=400, detail='Lesson with this ID already exists')
    
    # Если указан module_id, проверяем существование модуля
    if lesson.module_id:
        module = db.query(models.Module).filter(models.Module.id == lesson.module_id).first()
        if not module:
            raise HTTPException(status_code=404, detail='Module not found')
    
    lesson_data = lesson.dict()
    # Убеждаемся, что все поля имеют правильные значения по умолчанию
    if lesson_data.get('content_type') is None:
        lesson_data['content_type'] = 'text'
    if lesson_data.get('estimated_time') is None:
        lesson_data['estimated_time'] = 0
    if lesson_data.get('order_index') is None:
        lesson_data['order_index'] = 0
    # Устанавливаем статус 'draft' по умолчанию для новых уроков
    if lesson_data.get('status') is None:
        lesson_data['status'] = 'draft'
    
    new_lesson = models.Lesson(**lesson_data)
    db.add(new_lesson)
    db.flush()  # Получить ID урока
    
    # Обновить счетчик уроков в курсе, если урок привязан к модулю
    if lesson.module_id:
        module = db.query(models.Module).filter(models.Module.id == lesson.module_id).first()
        if module:
            update_course_lesson_count(db, module.course_id)
            safe_commit(db, "update_course_lesson_count_create")
    
    # Автоматически создать узел графа, если указано
    if create_graph_node:
        try:
            auto_position = (x == 0.0 and y == 0.0)
            crud.create_graph_node_for_lesson(
                db, 
                new_lesson, 
                x=x, 
                y=y, 
                auto_position=auto_position,
                auto_create_edge=True
            )
        except Exception as e:
            # Логируем ошибку, но не прерываем создание урока
            logger.warning(f"Failed to create graph node for lesson {new_lesson.id}: {e}", exc_info=True)
    
    safe_commit(db, "create_lesson")
    db.refresh(new_lesson)
    # Перезагружаем с joinedload для правильной сериализации
    new_lesson = db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == new_lesson.id).first()
    
    # Убеждаемся, что все обязательные поля имеют значения
    if new_lesson and new_lesson.order_index is None:
        new_lesson.order_index = 0
    if new_lesson and new_lesson.description is None:
        new_lesson.description = ""
    if new_lesson and new_lesson.content is None:
        new_lesson.content = ""
    if new_lesson and new_lesson.content_type is None:
        new_lesson.content_type = "text"
    if new_lesson and new_lesson.estimated_time is None:
        new_lesson.estimated_time = 0
    
    return new_lesson


@router.get('/admin/lessons', response_model=List[schemas.Lesson])
def list_lessons(
    module_id: Optional[str] = Query(None, description="Фильтр по модулю. Если 'free', возвращает уроки без модуля"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список уроков"""
    try:
        query = db.query(models.Lesson).options(
            joinedload(models.Lesson.handbook_excerpts),
            joinedload(models.Lesson.assignment)
        )
        if module_id:
            if module_id == 'free':
                # Уроки без модуля (свободные)
                query = query.filter(models.Lesson.module_id.is_(None))
            else:
                query = query.filter(models.Lesson.module_id == module_id)
        lessons = query.order_by(models.Lesson.order_index).all()
        
        # Убеждаемся, что все обязательные поля имеют значения
        for lesson in lessons:
            if lesson.order_index is None:
                lesson.order_index = 0
            if lesson.description is None:
                lesson.description = ""
            if lesson.content is None:
                lesson.content = ""
            if lesson.content_type is None:
                lesson.content_type = "text"
            if lesson.estimated_time is None:
                lesson.estimated_time = 0
            # Убеждаемся, что relationships правильно загружены
            # Если handbook_excerpts не загружены, устанавливаем пустой список
            if not hasattr(lesson, 'handbook_excerpts') or lesson.handbook_excerpts is None:
                lesson.handbook_excerpts = []
            # assignment может быть None, это нормально
        
        return lessons
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        logger.error(f"Error in list_lessons: {e}\n{error_detail}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load lessons: {str(e)}")


@router.get('/admin/lessons/{lesson_id}', response_model=schemas.Lesson)
def get_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить урок по ID"""
    lesson = db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail='Lesson not found')
    
    # Убеждаемся, что все обязательные поля имеют значения
    if lesson.order_index is None:
        lesson.order_index = 0
    if lesson.description is None:
        lesson.description = ""
    if lesson.content is None:
        lesson.content = ""
    if lesson.content_type is None:
        lesson.content_type = "text"
    if lesson.estimated_time is None:
        lesson.estimated_time = 0
    
    return lesson


@router.put('/admin/lessons/{lesson_id}', response_model=schemas.Lesson)
def update_lesson(
    lesson_id: str,
    lesson: schemas.LessonUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить урок"""
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail='Lesson not found')
    
    update_data = lesson.dict(exclude_unset=True)
    
    # Если изменяется module_id, нужно обновить счетчики
    old_module_id = db_lesson.module_id
    new_module_id = update_data.get('module_id')
    
    # Проверяем новый модуль, если он указан
    if new_module_id and new_module_id != old_module_id:
        new_module = db.query(models.Module).filter(models.Module.id == new_module_id).first()
        if not new_module:
            raise HTTPException(status_code=404, detail='Module not found')
    
    for key, value in update_data.items():
        setattr(db_lesson, key, value)
    
    # Обновляем счетчики уроков в курсах
    if old_module_id != new_module_id:
        # Уменьшаем счетчик в старом курсе (если урок был привязан к модулю)
        if old_module_id:
            old_module = db.query(models.Module).filter(models.Module.id == old_module_id).first()
            if old_module:
                update_course_lesson_count(db, old_module.course_id)
                safe_commit(db, "update_course_lesson_count_old")
        # Увеличиваем счетчик в новом курсе (если урок привязывается к модулю)
        if new_module_id:
            new_module = db.query(models.Module).filter(models.Module.id == new_module_id).first()
            if new_module:
                update_course_lesson_count(db, new_module.course_id)
                safe_commit(db, "update_course_lesson_count_new")
    
    # Синхронизировать название с узлом графа
    if 'title' in update_data:
        try:
            crud.update_graph_node_for_lesson(db, db_lesson, title=db_lesson.title)
        except Exception as e:
            logger.warning(f"Failed to update graph node for lesson {lesson_id}: {e}", exc_info=True)
    
    safe_commit(db, "update_lesson")
    db.refresh(db_lesson)
    # Перезагружаем с joinedload для правильной сериализации
    db_lesson = db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id).first()
    
    # Убеждаемся, что все обязательные поля имеют значения
    if db_lesson and db_lesson.order_index is None:
        db_lesson.order_index = 0
    if db_lesson and db_lesson.description is None:
        db_lesson.description = ""
    if db_lesson and db_lesson.content is None:
        db_lesson.content = ""
    if db_lesson and db_lesson.content_type is None:
        db_lesson.content_type = "text"
    if db_lesson and db_lesson.estimated_time is None:
        db_lesson.estimated_time = 0
    
    return db_lesson


@router.post('/admin/lessons/upload-video')
async def upload_video(
    file: UploadFile = File(...),
    lesson_id: str = Query(..., description="ID урока"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Загрузить видео для урока"""
    # Проверяем, что урок существует
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail='Lesson not found')
    
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail='File must be a video')
    
    # Создаем директорию для видео, если её нет
    upload_dir = os.path.join(os.getcwd(), 'uploads', 'videos')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.mp4'
    unique_filename = f"{lesson_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Сохраняем файл
    try:
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        logger.error(f"Error saving video file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail='Failed to save video file')
    
    # Формируем URL для доступа к видео
    # В продакшене это должен быть полный URL, например через CDN
    video_url = f"/uploads/videos/{unique_filename}"
    
    # Обновляем урок с URL видео
    lesson.video_url = video_url
    # Можно попытаться определить длительность видео, но это требует дополнительных библиотек
    # Пока оставляем пустым, пользователь может указать вручную
    safe_commit(db, "update_lesson_video")
    
    return JSONResponse({
        "video_url": video_url,
        "video_duration": lesson.video_duration or "",
        "message": "Video uploaded successfully"
    })


@router.post('/admin/lessons/{lesson_id}/publish')
def publish_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Опубликовать урок и синхронизировать все БД"""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail='Lesson not found')
    
    # Устанавливаем статус опубликован
    lesson.status = 'published'
    lesson.published_at = datetime.now()
    
    # Синхронизация счетчиков в модуле и курсе
    if lesson.module_id:
        module = db.query(models.Module).filter(models.Module.id == lesson.module_id).first()
        if module:
            # Обновляем счетчик уроков в курсе
            update_course_lesson_count(db, module.course_id)
            # Также обновляем счетчик модулей в курсе (на случай если модуль был создан)
            update_course_module_count(db, module.course_id)
    
    # Создаем/обновляем узел графа знаний, если его еще нет
    try:
        graph_node = crud.get_graph_node_by_entity(db, lesson.id, models.NodeType.lesson)
        if not graph_node:
            # Создаем узел графа, если его нет
            crud.create_graph_node_for_lesson(
                db,
                lesson,
                x=0.0,
                y=0.0,
                auto_position=True,
                auto_create_edge=True
            )
        else:
            # Обновляем статус узла на открытый, если урок опубликован
            graph_node.status = models.NodeStatus.open
            # Обновляем название узла, если оно изменилось
            if graph_node.title != lesson.title:
                graph_node.title = lesson.title
    except Exception as e:
        logger.warning(f"Failed to create/update graph node for lesson {lesson_id}: {e}", exc_info=True)
    
    # Создаем задание для урока, если его еще нет
    try:
        existing_assignment = db.query(models.Assignment).filter(
            models.Assignment.lesson_id == lesson_id
        ).first()
        if not existing_assignment:
            # Создаем базовое задание для урока
            assignment = models.Assignment(
                id=f"assignment-{lesson_id}",
                lesson_id=lesson_id,
                description="Выполните задание к уроку",
                criteria="",
                requires_text=True,
                requires_file=False,
                requires_link=False
            )
            db.add(assignment)
    except Exception as e:
        logger.warning(f"Failed to create assignment for lesson {lesson_id}: {e}", exc_info=True)
    
    safe_commit(db, "publish_lesson")
    return {
        'message': 'Lesson published successfully and synchronized with all databases',
        'lesson_id': lesson_id,
        'status': 'published',
        'published_at': lesson.published_at.isoformat() if lesson.published_at else None
    }


@router.delete('/admin/lessons/{lesson_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить урок"""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail='Lesson not found')
    
    course_id = None
    if lesson.module_id:
        module = db.query(models.Module).filter(models.Module.id == lesson.module_id).first()
        course_id = module.course_id if module else None
    
    # Удалить узел графа (каскадно удалятся связи через CASCADE)
    try:
        crud.delete_graph_node_for_lesson(db, lesson_id)
    except Exception as e:
        logger.warning(f"Failed to delete graph node for lesson {lesson_id}: {e}", exc_info=True)
    
    db.delete(lesson)
    safe_commit(db, "delete_lesson")
    
    # Обновить счетчик уроков в курсе (в одной транзакции)
    if course_id:
        update_course_lesson_count(db, course_id)
        safe_commit(db, "update_course_lesson_count")
    
    return None
