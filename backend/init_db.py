"""
Скрипт инициализации БД с данными из mockData.ts
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
import uuid

# Создаем таблицы
Base.metadata.create_all(bind=engine)


def init_tracks(db: Session):
    """Инициализация треков"""
    tracks_data = [
        {
            "id": models.TrackIdEnum.event,
            "name": "Ивент",
            "description": "Организация мероприятий и управление событиями",
            "color": "#E2B6C8"
        },
        {
            "id": models.TrackIdEnum.digital,
            "name": "Цифровые продукты",
            "description": "Product management и продуктовая аналитика",
            "color": "#B6E2C8"
        },
        {
            "id": models.TrackIdEnum.communication,
            "name": "Внешние коммуникации",
            "description": "Деловая коммуникация и внешние связи",
            "color": "#B6C8E2"
        },
        {
            "id": models.TrackIdEnum.design,
            "name": "Дизайн",
            "description": "Графический и продуктовый дизайн",
            "color": "#C8B6E2"
        }
    ]
    
    for track_data in tracks_data:
        track = models.Track(**track_data)
        db.add(track)
    
    db.commit()
    print("✓ Треки созданы")


def init_courses(db: Session):
    """Инициализация курсов"""
    courses_data = [
        {
            "id": "event-basics",
            "track_id": models.TrackIdEnum.event,
            "title": "Основы ивент-менеджмента",
            "version": "v1.0",
            "description": "Погружение в мир организации мероприятий: от концепции до пост-анализа",
            "short_description": "Научитесь планировать и проводить успешные мероприятия",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 12,
            "task_count": 15,
            "enrollment_deadline": "31 декабря 2025",
            "authors": ["Анна Смирнова", "Дмитрий Петров"]
        },
        {
            "id": "product-intro",
            "track_id": models.TrackIdEnum.digital,
            "title": "Введение в продуктовый менеджмент",
            "version": "v1.0",
            "description": "Основы работы продакт-менеджера: от идеи до запуска",
            "short_description": "Станьте продакт-менеджером цифрового продукта",
            "level": models.CourseLevel.beginner,
            "module_count": 4,
            "lesson_count": 18,
            "task_count": 22,
            "enrollment_deadline": "15 января 2026",
            "authors": ["Алексей Кузнецов", "Ольга Волкова"]
        },
        {
            "id": "business-comm",
            "track_id": models.TrackIdEnum.communication,
            "title": "Основы деловой переписки",
            "version": "v1.0",
            "description": "Эффективная деловая коммуникация в письменной форме",
            "short_description": "Email, мессенджеры и официальные письма",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 9,
            "task_count": 12,
            "authors": ["Наталья Морозова"]
        },
        {
            "id": "graphic-design",
            "track_id": models.TrackIdEnum.design,
            "title": "Основы графического дизайна",
            "version": "v1.0",
            "description": "Фундаментальные принципы визуального дизайна",
            "short_description": "Композиция, цвет и типографика",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 15,
            "task_count": 18,
            "authors": ["Артём Соколов"]
        }
    ]
    
    for course_data in courses_data:
        authors_list = course_data.pop("authors")
        course = models.Course(**course_data)
        db.add(course)
        db.flush()
        
        # Добавляем авторов
        for author_name in authors_list:
            author = models.CourseAuthor(
                course_id=course.id,
                author_name=author_name
            )
            db.add(author)
    
    db.commit()
    print(f"✓ Курсов создано: {len(courses_data)}")


def init_graph(db: Session):
    """Инициализация графа знаний"""
    # Узлы графа
    nodes_data = [
        {
            "id": "root",
            "type": models.NodeType.concept,
            "entity_id": "root",
            "title": "GRAPH",
            "x": 800.0,
            "y": 500.0,
            "status": models.NodeStatus.completed,
            "size": 80
        },
        {
            "id": "event-basics",
            "type": models.NodeType.course,
            "entity_id": "event-basics",
            "title": "Основы\\nИвентов",
            "x": 550.0,
            "y": 300.0,
            "status": models.NodeStatus.completed,
            "size": 45
        },
        {
            "id": "product-intro",
            "type": models.NodeType.course,
            "entity_id": "product-intro",
            "title": "Введение\\nв Продукт",
            "x": 1050.0,
            "y": 300.0,
            "status": models.NodeStatus.current,
            "size": 45
        },
        {
            "id": "business-comm",
            "type": models.NodeType.course,
            "entity_id": "business-comm",
            "title": "Деловая\\nПереписка",
            "x": 550.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45
        },
        {
            "id": "graphic-design",
            "type": models.NodeType.course,
            "entity_id": "graphic-design",
            "title": "Графический\\nДизайн",
            "x": 1050.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45
        }
    ]
    
    for node_data in nodes_data:
        node = models.GraphNode(**node_data)
        db.add(node)
    
    # Ребра графа
    edges_data = [
        {"id": "e1", "source_id": "root", "target_id": "event-basics", "type": models.EdgeType.required},
        {"id": "e2", "source_id": "root", "target_id": "product-intro", "type": models.EdgeType.required},
        {"id": "e3", "source_id": "root", "target_id": "business-comm", "type": models.EdgeType.required},
        {"id": "e4", "source_id": "root", "target_id": "graphic-design", "type": models.EdgeType.required},
    ]
    
    for edge_data in edges_data:
        edge = models.GraphEdge(**edge_data)
        db.add(edge)
    
    db.commit()
    print(f"✓ Граф создан: {len(nodes_data)} узлов, {len(edges_data)} ребер")


def init_demo_user(db: Session):
    """Создание демо-пользователя"""
    demo_user = models.User(
        id=str(uuid.uuid4()),
        email="demo@graph.com",
        username="demo",
        full_name="Demo User",
        hashed_password=get_password_hash("demo123")
    )
    db.add(demo_user)
    
    # Добавляем прогресс по курсам
    user_course_1 = models.UserCourse(
        user_id=demo_user.id,
        course_id="product-intro",
        status=models.CourseStatus.in_progress,
        progress=35.0
    )
    db.add(user_course_1)
    
    db.commit()
    print(f"✓ Демо-пользователь создан (username: demo, password: demo123)")


def main():
    """Основная функция инициализации"""
    print("Начинаем инициализацию БД...")
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже данные
        existing_tracks = db.query(models.Track).count()
        if existing_tracks > 0:
            print("⚠ БД уже содержит данные. Пропускаем инициализацию.")
            print("Для переинициализации удалите БД и запустите скрипт снова.")
            return
        
        init_tracks(db)
        init_courses(db)
        init_graph(db)
        init_demo_user(db)
        
        print("\n✅ Инициализация БД завершена успешно!")
        print("\nДля входа используйте:")
        print("  Username: demo")
        print("  Password: demo123")
        
    except Exception as e:
        print(f"\n❌ Ошибка при инициализации: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

