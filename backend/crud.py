from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import models
import schemas
from auth import get_password_hash
import uuid


# Users
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Создать пользователя"""
    db_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Tracks
def get_tracks(db: Session) -> List[models.Track]:
    """Получить все треки"""
    return db.query(models.Track).all()


def get_track(db: Session, track_id: str) -> Optional[models.Track]:
    """Получить трек по ID"""
    return db.query(models.Track).filter(models.Track.id == track_id).first()


# Courses
def get_courses(db: Session, track_id: Optional[str] = None, user_id: Optional[str] = None, published_only: bool = True) -> List[dict]:
    """Получить все курсы с прогрессом пользователя"""
    query = db.query(models.Course).options(joinedload(models.Course.authors))
    
    # По умолчанию показываем только опубликованные курсы
    if published_only:
        query = query.filter(models.Course.status == 'published')
    
    if track_id:
        query = query.filter(models.Course.track_id == track_id)
    
    courses = query.all()
    
    # Если user_id передан, добавляем прогресс
    result = []
    for course in courses:
        course_dict = {
            "id": course.id,
            "track_id": course.track_id.value if hasattr(course.track_id, 'value') else course.track_id,
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


def get_course(db: Session, course_id: str, user_id: Optional[str] = None, published_only: bool = False) -> Optional[dict]:
    """Получить курс по ID с прогрессом"""
    query = db.query(models.Course).options(joinedload(models.Course.authors)).filter(
        models.Course.id == course_id
    )
    
    # Для публичного доступа показываем только опубликованные курсы
    if published_only:
        query = query.filter(models.Course.status == 'published')
    
    course = query.first()
    
    if not course:
        return None
    
    course_dict = {
        "id": course.id,
        "track_id": course.track_id.value if hasattr(course.track_id, 'value') else course.track_id,
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
    """Получить все модули курса"""
    return db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).order_by(models.Module.order_index).all()


def get_module(db: Session, module_id: str) -> Optional[models.Module]:
    """Получить модуль по ID"""
    return db.query(models.Module).filter(models.Module.id == module_id).first()


# Lessons
def get_lessons(db: Session, module_id: str, published_only: bool = True) -> List[models.Lesson]:
    """Получить все уроки модуля"""
    query = db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id
    )
    # Фильтруем только опубликованные уроки для обычных пользователей
    if published_only:
        query = query.filter(models.Lesson.status == 'published')
    return query.order_by(models.Lesson.order_index).all()


def get_lesson(db: Session, lesson_id: str, published_only: bool = True) -> Optional[models.Lesson]:
    """Получить урок по ID"""
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.handbook_excerpts),
        joinedload(models.Lesson.assignment)
    ).filter(models.Lesson.id == lesson_id)
    # Фильтруем только опубликованные уроки для обычных пользователей
    if published_only:
        query = query.filter(models.Lesson.status == 'published')
    return query.first()


# Graph
def get_graph_nodes(db: Session, user_id: Optional[str] = None) -> List[models.GraphNode]:
    """Получить все узлы графа, автоматически создавая узлы для курсов и модулей из БД, которых нет в графе"""
    # Сначала получаем все существующие узлы
    all_nodes = db.query(models.GraphNode).all()
    valid_nodes = []
    existing_module_ids = set()
    existing_course_ids = set()
    nodes_created = False
    
    # Собираем ID модулей и курсов, для которых уже есть узлы графа
    for node in all_nodes:
        if node.type == models.NodeType.module and node.entity_id:
            existing_module_ids.add(node.entity_id)
        elif node.type == models.NodeType.course and node.entity_id:
            existing_course_ids.add(node.entity_id)
    
    # Получаем все курсы из БД и создаем узлы для тех, которых нет
    all_courses = db.query(models.Course).all()
    for course in all_courses:
        if course.id not in existing_course_ids:
            try:
                course_node = get_graph_node_by_entity(db, course.id, models.NodeType.course)
                if not course_node:
                    # Создаем узел графа для курса
                    course_node = models.GraphNode(
                        id=f"node-{course.id}",
                        type=models.NodeType.course,
                        entity_id=course.id,
                        title=course.title,
                        x=0.0,  # Координаты будут установлены алгоритмом размещения
                        y=0.0,
                        status=models.NodeStatus.open,
                        size=150
                    )
                    db.add(course_node)
                    nodes_created = True
                existing_course_ids.add(course.id)
                if course_node not in all_nodes:
                    all_nodes.append(course_node)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to create graph node for course {course.id}: {e}")
    
    # Получаем все модули из БД и создаем узлы для тех, которых нет
    all_modules = db.query(models.Module).all()
    for module in all_modules:
        if module.id not in existing_module_ids:
            try:
                graph_node = create_graph_node_for_module(db, module, auto_create_edge=True)
                existing_module_ids.add(module.id)
                if graph_node not in all_nodes:
                    all_nodes.append(graph_node)
                nodes_created = True
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to create graph node for module {module.id}: {e}")
    
    # Коммитим изменения, если были созданы новые узлы
    if nodes_created:
        try:
            db.commit()
            # Перезагружаем узлы после коммита
            all_nodes = db.query(models.GraphNode).all()
        except Exception:
            db.rollback()
    
    # Фильтруем узлы, проверяя существование entity в БД
    # Оптимизация: предзагружаем все сущности для проверки в одном запросе (избегаем N+1)
    all_courses_dict = {c.id: c for c in db.query(models.Course).all()}
    all_modules_dict = {m.id: m for m in db.query(models.Module).all()}
    all_lessons_dict = {l.id: l for l in db.query(models.Lesson).all()}
    all_tracks_dict = {t.id: t for t in db.query(models.Track).all()}
    
    # Фильтруем узлы, проверяя существование entity в БД (без N+1)
    for node in all_nodes:
        # Проверяем существование entity в БД в зависимости от типа узла
        if node.type == models.NodeType.course and node.entity_id in all_courses_dict:
            valid_nodes.append(node)
        elif node.type == models.NodeType.module and node.entity_id in all_modules_dict:
            valid_nodes.append(node)
        elif node.type == models.NodeType.lesson and node.entity_id in all_lessons_dict:
            valid_nodes.append(node)
        elif node.type == models.NodeType.concept:
            # Концепты (например, root) всегда валидны
            valid_nodes.append(node)
        elif node.type == models.NodeType.track and node.entity_id in all_tracks_dict:
            valid_nodes.append(node)
        else:
            # Для неизвестных типов оставляем узел
            valid_nodes.append(node)
    
    return valid_nodes


def get_graph_edges(db: Session) -> List[models.GraphEdge]:
    """Получить все ребра графа, фильтруя те, которые ссылаются на несуществующие узлы"""
    all_edges = db.query(models.GraphEdge).all()
    valid_edges = []
    
    for edge in all_edges:
        # Проверяем существование обоих узлов
        source_node = db.query(models.GraphNode).filter(models.GraphNode.id == edge.source_id).first()
        target_node = db.query(models.GraphNode).filter(models.GraphNode.id == edge.target_id).first()
        
        if source_node and target_node:
            valid_edges.append(edge)
        else:
            # Удаляем ребро, если один из узлов не существует
            db.delete(edge)
    
    if len(all_edges) != len(valid_edges):
        db.commit()
    
    return valid_edges


def get_graph_node_by_entity(db: Session, entity_id: str, node_type: models.NodeType) -> Optional[models.GraphNode]:
    """Получить узел графа по entity_id и типу"""
    return db.query(models.GraphNode).filter(
        models.GraphNode.entity_id == entity_id,
        models.GraphNode.type == node_type
    ).first()


def create_graph_node_for_lesson(
    db: Session,
    lesson: models.Lesson,
    x: float = 0.0,
    y: float = 0.0,
    auto_position: bool = True,
    auto_create_edge: bool = True
) -> models.GraphNode:
    """Создать узел графа для урока"""
    # Проверяем, существует ли уже узел
    existing = get_graph_node_by_entity(db, lesson.id, models.NodeType.lesson)
    if existing:
        return existing
    
    # Автопозиционирование: находим позицию последнего узла урока в том же модуле
    if auto_position and x == 0.0 and y == 0.0:
        # Получаем все уроки модуля
        module_lessons = db.query(models.Lesson).filter(
            models.Lesson.module_id == lesson.module_id
        ).order_by(models.Lesson.order_index).all()
        
        # Находим позицию текущего урока
        lesson_index = next((i for i, l in enumerate(module_lessons) if l.id == lesson.id), 0)
        
        # Получаем координаты модуля или используем дефолтные
        module_node = get_graph_node_by_entity(db, lesson.module_id, models.NodeType.module)
        if module_node:
            base_x = module_node.x
            base_y = module_node.y
        else:
            base_x = 500.0
            base_y = 500.0
        
        # Располагаем уроки по кругу вокруг узла модуля
        import math
        angle = (2 * math.pi * lesson_index) / max(len(module_lessons), 1)
        radius = 150.0
        x = base_x + radius * math.cos(angle)
        y = base_y + radius * math.sin(angle)
    
    graph_node = models.GraphNode(
        id=f"node-{lesson.id}",
        type=models.NodeType.lesson,
        entity_id=lesson.id,
        title=lesson.title,
        x=x,
        y=y,
        status=models.NodeStatus.open,
        size=40
    )
    db.add(graph_node)
    db.flush()  # Получить ID узла перед созданием связи
    
    # Автоматически создать связь с узлом модуля, если он существует
    if auto_create_edge:
        module_node = get_graph_node_by_entity(db, lesson.module_id, models.NodeType.module)
        if module_node:
            # Проверяем, что связь еще не существует
            existing_edge = db.query(models.GraphEdge).filter(
                models.GraphEdge.source_id == module_node.id,
                models.GraphEdge.target_id == graph_node.id
            ).first()
            if not existing_edge:
                edge = models.GraphEdge(
                    id=f"edge-{module_node.id}-{graph_node.id}",
                    source_id=module_node.id,
                    target_id=graph_node.id,
                    type=models.EdgeType.required
                )
                db.add(edge)
    
    # Не делаем commit здесь - он будет сделан в роутере
    # Объект будет доступен после flush в текущей транзакции
    return graph_node


def update_graph_node_for_lesson(
    db: Session,
    lesson: models.Lesson,
    title: Optional[str] = None
) -> Optional[models.GraphNode]:
    """Обновить узел графа для урока"""
    graph_node = get_graph_node_by_entity(db, lesson.id, models.NodeType.lesson)
    if graph_node and title:
        graph_node.title = title
        # Не делаем commit здесь - он будет сделан в роутере
        db.add(graph_node)  # Помечаем объект как измененный
    return graph_node


def delete_graph_node_for_lesson(db: Session, lesson_id: str) -> bool:
    """Удалить узел графа для урока"""
    graph_node = get_graph_node_by_entity(db, lesson_id, models.NodeType.lesson)
    if graph_node:
        db.delete(graph_node)
        # Не делаем commit здесь - он будет сделан в роутере вместе с удалением урока
        return True
    return False


def delete_graph_node_for_course(db: Session, course_id: str) -> bool:
    """Удалить узел графа для курса и все связанные узлы модулей/уроков"""
    graph_node = get_graph_node_by_entity(db, course_id, models.NodeType.course)
    if graph_node:
        # Удаляем все входящие и исходящие связи
        incoming_edges = db.query(models.GraphEdge).filter(
            models.GraphEdge.target_id == graph_node.id
        ).all()
        outgoing_edges = db.query(models.GraphEdge).filter(
            models.GraphEdge.source_id == graph_node.id
        ).all()
        
        for edge in incoming_edges + outgoing_edges:
            db.delete(edge)
        
        # Удаляем сам узел курса
        db.delete(graph_node)
        return True
    return False


def delete_graph_node_for_module(db: Session, module_id: str) -> bool:
    """Удалить узел графа для модуля и все связанные ребра"""
    graph_node = get_graph_node_by_entity(db, module_id, models.NodeType.module)
    if graph_node:
        # Удаляем все ребра, связанные с этим узлом (входящие и исходящие)
        # Ребра удалятся автоматически через CASCADE, но лучше сделать явно для ясности
        incoming_edges = db.query(models.GraphEdge).filter(
            models.GraphEdge.target_id == graph_node.id
        ).all()
        outgoing_edges = db.query(models.GraphEdge).filter(
            models.GraphEdge.source_id == graph_node.id
        ).all()
        
        for edge in incoming_edges + outgoing_edges:
            db.delete(edge)
        
        # Удаляем сам узел
        db.delete(graph_node)
        # Не делаем commit здесь - он будет сделан в роутере вместе с удалением модуля
        return True
    return False


def get_lesson_with_graph_node(db: Session, lesson_id: str) -> Optional[dict]:
    """Получить урок с информацией о графе"""
    lesson = get_lesson(db, lesson_id)
    if not lesson:
        return None
    
    graph_node = get_graph_node_by_entity(db, lesson_id, models.NodeType.lesson)
    
    result = {
        "id": lesson.id,
        "module_id": lesson.module_id,
        "title": lesson.title,
        "description": lesson.description,
        "content": lesson.content,
        "video_url": lesson.video_url,
        "video_duration": lesson.video_duration,
        "order_index": lesson.order_index,
        "content_type": lesson.content_type,
        "tags": lesson.tags,
        "estimated_time": lesson.estimated_time,
    }
    
    if graph_node:
        result["graph"] = {
            "node_id": graph_node.id,
            "x": graph_node.x,
            "y": graph_node.y,
            "status": graph_node.status.value if graph_node.status else None,
            "size": graph_node.size
        }
        
        # Получаем связи
        outgoing = db.query(models.GraphEdge).filter(
            models.GraphEdge.source_id == graph_node.id
        ).all()
        
        incoming = db.query(models.GraphEdge).filter(
            models.GraphEdge.target_id == graph_node.id
        ).all()
        
        result["graph"]["connections"] = {
            "outgoing": [{
                "id": e.id,
                "target_id": e.target_id,
                "type": e.type.value if e.type else None
            } for e in outgoing],
            "incoming": [{
                "id": e.id,
                "source_id": e.source_id,
                "type": e.type.value if e.type else None
            } for e in incoming]
        }
    
    return result


def create_graph_node_for_module(
    db: Session,
    module: models.Module,
    x: float = 0.0,
    y: float = 0.0,
    auto_create_edge: bool = True
) -> models.GraphNode:
    """Создать узел графа для модуля"""
    existing = get_graph_node_by_entity(db, module.id, models.NodeType.module)
    if existing:
        return existing
    
    # Если координаты не указаны, размещаем модули вокруг курса в радиальном порядке
    if x == 0.0 and y == 0.0:
        course_node = get_graph_node_by_entity(db, module.course_id, models.NodeType.course)
        if course_node:
            # Определяем направление курса от центра
            course_x, course_y = course_node.x, course_node.y
            
            # Получаем все модули этого курса для правильного позиционирования
            all_modules = db.query(models.Module).filter(
                models.Module.course_id == module.course_id
            ).order_by(models.Module.order_index).all()
            
            # Находим индекс текущего модуля
            module_index = next((i for i, m in enumerate(all_modules) if m.id == module.id), module.order_index)
            
            # Определяем направление от курса к центру
            center_x, center_y = 0, 0
            direction_x = center_x - course_x
            direction_y = center_y - course_y
            
            # Нормализуем направление
            length = (direction_x ** 2 + direction_y ** 2) ** 0.5
            if length > 0:
                direction_x /= length
                direction_y /= length
            
            # Перпендикулярное направление для размещения модулей в ряд
            perp_x = -direction_y
            perp_y = direction_x
            
            # Расстояние от курса до модулей
            distance_from_course = 200
            
            # Смещение вдоль перпендикуляра (модули в ряд)
            offset_along_perp = (module_index - len(all_modules) / 2 + 0.5) * 150
            
            # Позиция модуля
            x = course_x + direction_x * distance_from_course + perp_x * offset_along_perp
            y = course_y + direction_y * distance_from_course + perp_y * offset_along_perp
        else:
            # Если курс не найден, размещаем по умолчанию
            x = 500.0 + (module.order_index * 200)
            y = 500.0
    
    graph_node = models.GraphNode(
        id=f"node-{module.id}",
        type=models.NodeType.module,
        entity_id=module.id,
        title=module.title,
        x=x,
        y=y,
        status=models.NodeStatus.open,
        size=120  # Увеличиваем размер для модулей
    )
    db.add(graph_node)
    db.flush()  # Получить ID узла перед созданием связи
    
    # Автоматически создать связь с узлом курса, если он существует
    if auto_create_edge:
        course_node = get_graph_node_by_entity(db, module.course_id, models.NodeType.course)
        if course_node:
            # Проверяем, что связь еще не существует
            existing_edge = db.query(models.GraphEdge).filter(
                models.GraphEdge.source_id == course_node.id,
                models.GraphEdge.target_id == graph_node.id
            ).first()
            if not existing_edge:
                edge = models.GraphEdge(
                    id=f"edge-{course_node.id}-{graph_node.id}",
                    source_id=course_node.id,
                    target_id=graph_node.id,
                    type=models.EdgeType.required
                )
                db.add(edge)
    
    # Не делаем commit здесь - он будет сделан в роутере
    # Объект будет доступен после flush в текущей транзакции
    return graph_node


def create_graph_node_for_course(
    db: Session,
    course: models.Course,
    x: float = 0.0,
    y: float = 0.0
) -> models.GraphNode:
    """Создать узел графа для курса"""
    existing = get_graph_node_by_entity(db, course.id, models.NodeType.course)
    if existing:
        return existing
    
    if x == 0.0 and y == 0.0:
        # Автопозиционирование: 4 курса в разных направлениях от центра
        # Центр графа: (0, 0)
        # Расстояние от центра: 500
        course_positions = {
            'design': (0, -500),      # Север
            'event-basics': (500, 0),      # Восток
            'product-intro': (0, 500),       # Юг
            'business-comm': (-500, 0),    # Запад
        }
        
        if course.id in course_positions:
            x, y = course_positions[course.id]
        else:
            # Если курс не в списке фиксированных, размещаем по умолчанию
            x = 0.0
            y = 0.0
    
    graph_node = models.GraphNode(
        id=f"node-{course.id}",
        type=models.NodeType.course,
        entity_id=course.id,
        title=course.title,
        x=x,
        y=y,
        status=models.NodeStatus.open,
        size=80  # Увеличиваем размер для курсов
    )
    db.add(graph_node)
    db.flush()  # Получить ID узла, но не коммитить - commit будет в роутере
    # Не делаем commit здесь - он будет сделан в роутере
    # Объект будет доступен после flush в текущей транзакции
    return graph_node


# Submissions
def create_submission(db: Session, submission: schemas.SubmissionCreate, user_id: str) -> models.Submission:
    """Создать submission"""
    # Проверяем существующие submissions
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
    
    # Добавляем файлы если есть
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


def get_user_submissions(db: Session, user_id: str) -> List[models.Submission]:
    """Получить все submissions пользователя"""
    return db.query(models.Submission).filter(
        models.Submission.user_id == user_id
    ).order_by(models.Submission.created_at.desc()).all()


# Notifications
def get_user_notifications(db: Session, user_id: str, unread_only: bool = False) -> List[models.Notification]:
    """Получить уведомления пользователя"""
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc()).all()


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> Optional[models.Notification]:
    """Отметить уведомление как прочитанное"""
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
    """Обновить прогресс по курсу"""
    # Конвертируем строку в enum
    try:
        status_enum = models.CourseStatus(status)
    except ValueError:
        raise ValueError(f"Invalid status: {status}. Must be one of: {[s.value for s in models.CourseStatus]}")
    
    user_course = db.query(models.UserCourse).filter(
        models.UserCourse.user_id == user_id,
        models.UserCourse.course_id == course_id
    ).first()
    
    if user_course:
        user_course.progress = progress
        user_course.status = status_enum
        if status_enum == models.CourseStatus.completed and not user_course.completed_at:
            user_course.completed_at = func.now()
    else:
        user_course = models.UserCourse(
            user_id=user_id,
            course_id=course_id,
            progress=progress,
            status=status_enum,
            started_at=func.now()
        )
        db.add(user_course)
    
    db.commit()
    return user_course


def update_lesson_progress(db: Session, user_id: str, lesson_id: str, status: str):
    """Обновить прогресс по уроку"""
    # Конвертируем строку в enum (UserLesson использует CourseStatus)
    try:
        status_enum = models.CourseStatus(status)
    except ValueError:
        raise ValueError(f"Invalid status: {status}. Must be one of: {[s.value for s in models.CourseStatus]}")
    
    user_lesson = db.query(models.UserLesson).filter(
        models.UserLesson.user_id == user_id,
        models.UserLesson.lesson_id == lesson_id
    ).first()
    
    if user_lesson:
        user_lesson.status = status_enum
        if status_enum == models.CourseStatus.completed and not user_lesson.completed_at:
            user_lesson.completed_at = datetime.utcnow()
    else:
        user_lesson = models.UserLesson(
            user_id=user_id,
            lesson_id=lesson_id,
            status=status_enum,
            completed_at=datetime.utcnow() if status_enum == models.CourseStatus.completed else None
        )
        db.add(user_lesson)
    
    db.commit()
    return user_lesson


def get_first_lesson_id(db: Session, course_id: str) -> Optional[str]:
    """Получить ID первого урока курса (первый урок первого модуля)"""
    # Получаем модули курса, отсортированные по order_index
    modules = db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).order_by(models.Module.order_index).all()
    
    if not modules:
        return None
    
    # Берем первый модуль
    first_module = modules[0]
    
    # Получаем уроки модуля, отсортированные по order_index
    lessons = db.query(models.Lesson).filter(
        models.Lesson.module_id == first_module.id
    ).order_by(models.Lesson.order_index).all()
    
    if not lessons:
        return None
    
    # Возвращаем ID первого урока
    return lessons[0].id


# Audit Logging
def log_audit(
    db: Session,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    old_data: Optional[dict] = None,
    new_data: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> models.AuditLog:
    """Логирование действия в таблицу аудита"""
    import json
    
    audit_log = models.AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,  # CREATE, UPDATE, DELETE
        entity_type=entity_type,
        entity_id=entity_id,
        old_data=json.dumps(old_data) if old_data else None,
        new_data=json.dumps(new_data) if new_data else None,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()
    return audit_log


def get_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100
) -> List[models.AuditLog]:
    """Получить логи аудита с фильтрацией"""
    query = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc())
    
    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    if action:
        query = query.filter(models.AuditLog.action == action)
    
    return query.limit(limit).all()
