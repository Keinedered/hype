"""
Скрипт инициализации БД с демо-данными.
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
            "id": "event",
            "name": "Ивент",
            "description": "Организация мероприятий и управление событиями",
            "color": "#E2B6C8",
        },
        {
            "id": "digital",
            "name": "Цифровые продукты",
            "description": "Product management и продуктовая аналитика",
            "color": "#B6E2C8",
        },
        {
            "id": "communication",
            "name": "Внешние коммуникации",
            "description": "Деловая коммуникация и внешние связи",
            "color": "#B6C8E2",
        },
        {
            "id": "design",
            "name": "Дизайн",
            "description": "Графический и продуктовый дизайн",
            "color": "#C8B6E2",
        },
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
            "track_id": "event",
            "title": "Основы ивент-менеджмента",
            "version": "v1.0",
            "description": "Погружение в мир организации мероприятий: от концепции до пост-анализа",
            "short_description": "Научитесь планировать и проводить успешные мероприятия",
            "level": models.CourseLevel.beginner,
            "module_count": 2,
            "lesson_count": 4,
            "task_count": 2,
            "enrollment_deadline": "31 декабря 2025",
            "authors": ["Анна Смирнова", "Дмитрий Петров"],
        },
        {
            "id": "product-intro",
            "track_id": "digital",
            "title": "Введение в продуктовый менеджмент",
            "version": "v1.0",
            "description": "Основы работы продакт-менеджера: от идеи до запуска",
            "short_description": "Станьте продакт-менеджером цифрового продукта",
            "level": models.CourseLevel.beginner,
            "module_count": 2,
            "lesson_count": 4,
            "task_count": 2,
            "enrollment_deadline": "15 января 2026",
            "authors": ["Алексей Кузнецов", "Ольга Волкова"],
        },
        {
            "id": "business-comm",
            "track_id": "communication",
            "title": "Основы деловой переписки",
            "version": "v1.0",
            "description": "Эффективная деловая коммуникация в письменной форме",
            "short_description": "Email, мессенджеры и официальные письма",
            "level": models.CourseLevel.beginner,
            "module_count": 2,
            "lesson_count": 4,
            "task_count": 2,
            "authors": ["Наталья Морозова"],
        },
        {
            "id": "graphic-design",
            "track_id": "design",
            "title": "Основы графического дизайна",
            "version": "v1.0",
            "description": "Фундаментальные принципы визуального дизайна",
            "short_description": "Композиция, цвет и типографика",
            "level": models.CourseLevel.beginner,
            "module_count": 2,
            "lesson_count": 4,
            "task_count": 2,
            "authors": ["Артём Соколов"],
        },
    ]

    for course_data in courses_data:
        authors_list = course_data.pop("authors")
        course = models.Course(**course_data)
        db.add(course)
        db.flush()

        for author_name in authors_list:
            author = models.CourseAuthor(course_id=course.id, author_name=author_name)
            db.add(author)

    db.commit()
    print(f"✓ Курсов создано: {len(courses_data)}")


def init_modules_and_lessons(db: Session):
    """Инициализация модулей и уроков"""
    modules_data = [
        {
            "id": "event-basics-m1",
            "course_id": "event-basics",
            "title": "Введение в ивент-менеджмент",
            "description": "Роль ивент-менеджера, типы мероприятий и базовые термины.",
            "order_index": 1,
        },
        {
            "id": "event-basics-m2",
            "course_id": "event-basics",
            "title": "Планирование мероприятия",
            "description": "Цели, аудитория и сценарий события.",
            "order_index": 2,
        },
        {
            "id": "product-intro-m1",
            "course_id": "product-intro",
            "title": "Продукт и ценность",
            "description": "Что такое продукт, ценностное предложение и роль продакта.",
            "order_index": 1,
        },
        {
            "id": "product-intro-m2",
            "course_id": "product-intro",
            "title": "Исследования пользователей",
            "description": "Интервью, сегментация и анализ инсайтов.",
            "order_index": 2,
        },
        {
            "id": "business-comm-m1",
            "course_id": "business-comm",
            "title": "Основы деловой переписки",
            "description": "Тон коммуникации и базовые правила.",
            "order_index": 1,
        },
        {
            "id": "business-comm-m2",
            "course_id": "business-comm",
            "title": "Структура письма",
            "description": "Тема, вводная часть, призыв к действию.",
            "order_index": 2,
        },
        {
            "id": "graphic-design-m1",
            "course_id": "graphic-design",
            "title": "Композиция и цвет",
            "description": "Баланс, контраст и цветовые палитры.",
            "order_index": 1,
        },
        {
            "id": "graphic-design-m2",
            "course_id": "graphic-design",
            "title": "Типографика и сетки",
            "description": "Иерархия, сетки и читаемость.",
            "order_index": 2,
        },
    ]

    lessons_data = [
        {
            "id": "event-basics-m1-l1",
            "module_id": "event-basics-m1",
            "title": "Роль ивент-менеджера",
            "description": "Ключевые задачи и зоны ответственности.",
            "video_url": None,
            "video_duration": "08:20",
            "content": """# Роль ивент-менеджера\n\n- Планирование события и контроль исполнения.\n- Работа со стейкхолдерами и подрядчиками.\n- Управление рисками и бюджетом.\n""",
            "order_index": 1,
        },
        {
            "id": "event-basics-m1-l2",
            "module_id": "event-basics-m1",
            "title": "Типы мероприятий",
            "description": "Форматы событий и цели каждого формата.",
            "video_url": None,
            "video_duration": "10:05",
            "content": """# Типы мероприятий\n\nРазберите форматы: конференции, митапы, внутренние события и промо.\n""",
            "order_index": 2,
        },
        {
            "id": "event-basics-m2-l1",
            "module_id": "event-basics-m2",
            "title": "Цели и аудитория",
            "description": "Как сформулировать цель события и описать аудиторию.",
            "video_url": None,
            "video_duration": "09:30",
            "content": """# Цели и аудитория\n\nОпишите цель, метрики и портреты участников.\n""",
            "order_index": 1,
        },
        {
            "id": "event-basics-m2-l2",
            "module_id": "event-basics-m2",
            "title": "Сценарий и тайминг",
            "description": "Как сделать программу события логичной и понятной.",
            "video_url": None,
            "video_duration": "11:00",
            "content": """# Сценарий и тайминг\n\nСоставьте таймлайн события и точки контроля.\n""",
            "order_index": 2,
        },
        {
            "id": "product-intro-m1-l1",
            "module_id": "product-intro-m1",
            "title": "Что такое продукт",
            "description": "Определение продукта и ключевая ценность.",
            "video_url": None,
            "video_duration": "07:45",
            "content": """# Что такое продукт\n\nПродукт решает задачу пользователя и создаёт ценность для бизнеса.\n""",
            "order_index": 1,
        },
        {
            "id": "product-intro-m1-l2",
            "module_id": "product-intro-m1",
            "title": "Роль продакт-менеджера",
            "description": "Баланс пользовательской ценности и бизнес-целей.",
            "video_url": None,
            "video_duration": "09:10",
            "content": """# Роль продакта\n\nПродакт управляет видением, задачами и приоритетами продукта.\n""",
            "order_index": 2,
        },
        {
            "id": "product-intro-m2-l1",
            "module_id": "product-intro-m2",
            "title": "Интервью с пользователями",
            "description": "Подготовка и проведение интервью.",
            "video_url": None,
            "video_duration": "12:00",
            "content": """# Интервью\n\nСформируйте гипотезы, вопросы и сценарий интервью.\n""",
            "order_index": 1,
        },
        {
            "id": "product-intro-m2-l2",
            "module_id": "product-intro-m2",
            "title": "Сегментация и инсайты",
            "description": "Как группировать данные и формулировать выводы.",
            "video_url": None,
            "video_duration": "10:40",
            "content": """# Сегментация\n\nОбъединяйте пользователей по целям и поведению, фиксируйте инсайты.\n""",
            "order_index": 2,
        },
        {
            "id": "business-comm-m1-l1",
            "module_id": "business-comm-m1",
            "title": "Тон и стиль",
            "description": "Деловой стиль и уважительное общение.",
            "video_url": None,
            "video_duration": "06:35",
            "content": """# Тон и стиль\n\nИспользуйте нейтральный тон, избегайте двусмысленностей.\n""",
            "order_index": 1,
        },
        {
            "id": "business-comm-m1-l2",
            "module_id": "business-comm-m1",
            "title": "Ошибки в переписке",
            "description": "Типичные ошибки и как их избегать.",
            "video_url": None,
            "video_duration": "08:05",
            "content": """# Ошибки\n\nСокращайте длинные письма и проверяйте структуру.\n""",
            "order_index": 2,
        },
        {
            "id": "business-comm-m2-l1",
            "module_id": "business-comm-m2",
            "title": "Тема и вводная часть",
            "description": "Как написать понятную тему письма.",
            "video_url": None,
            "video_duration": "07:20",
            "content": """# Тема письма\n\nТема должна отражать цель и быть конкретной.\n""",
            "order_index": 1,
        },
        {
            "id": "business-comm-m2-l2",
            "module_id": "business-comm-m2",
            "title": "Призыв к действию",
            "description": "Фиксируем следующий шаг и дедлайн.",
            "video_url": None,
            "video_duration": "07:55",
            "content": """# Призыв к действию\n\nВсегда указывайте, что нужно сделать и к какому сроку.\n""",
            "order_index": 2,
        },
        {
            "id": "graphic-design-m1-l1",
            "module_id": "graphic-design-m1",
            "title": "Композиция",
            "description": "Баланс и визуальная иерархия.",
            "video_url": None,
            "video_duration": "09:00",
            "content": """# Композиция\n\nВыравнивайте элементы и используйте сетки.\n""",
            "order_index": 1,
        },
        {
            "id": "graphic-design-m1-l2",
            "module_id": "graphic-design-m1",
            "title": "Цветовые палитры",
            "description": "Как подбирать и сочетать цвета.",
            "video_url": None,
            "video_duration": "10:15",
            "content": """# Цвет\n\nСоберите палитру и проверьте контрастность.\n""",
            "order_index": 2,
        },
        {
            "id": "graphic-design-m2-l1",
            "module_id": "graphic-design-m2",
            "title": "Типографика",
            "description": "Выбор шрифтов и их роли.",
            "video_url": None,
            "video_duration": "08:50",
            "content": """# Типографика\n\nИспользуйте не более 2-3 шрифтов в одном макете.\n""",
            "order_index": 1,
        },
        {
            "id": "graphic-design-m2-l2",
            "module_id": "graphic-design-m2",
            "title": "Сетки и ритм",
            "description": "Как выстраивать структуру страницы.",
            "video_url": None,
            "video_duration": "09:25",
            "content": """# Сетки\n\nСетка помогает удерживать ритм и упрощает масштабирование.\n""",
            "order_index": 2,
        },
    ]

    modules = [models.Module(**data) for data in modules_data]
    db.add_all(modules)
    db.flush()

    lessons = [models.Lesson(**data) for data in lessons_data]
    db.add_all(lessons)

    db.commit()
    print(f"✓ Модулей создано: {len(modules_data)}")
    print(f"✓ Уроков создано: {len(lessons_data)}")


def init_graph(db: Session):
    """Инициализация графа знаний"""
    nodes_data = [
        {
            "id": "root",
            "type": models.NodeType.concept,
            "entity_id": "root",
            "title": "GRAPH",
            "x": 800.0,
            "y": 500.0,
            "status": models.NodeStatus.completed,
            "size": 80,
        },
        {
            "id": "event-basics",
            "type": models.NodeType.course,
            "entity_id": "event-basics",
            "title": "Основы\nИвентов",
            "x": 550.0,
            "y": 300.0,
            "status": models.NodeStatus.completed,
            "size": 45,
        },
        {
            "id": "product-intro",
            "type": models.NodeType.course,
            "entity_id": "product-intro",
            "title": "Введение\nв Продукт",
            "x": 1050.0,
            "y": 300.0,
            "status": models.NodeStatus.current,
            "size": 45,
        },
        {
            "id": "business-comm",
            "type": models.NodeType.course,
            "entity_id": "business-comm",
            "title": "Деловая\nПереписка",
            "x": 550.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45,
        },
        {
            "id": "graphic-design",
            "type": models.NodeType.course,
            "entity_id": "graphic-design",
            "title": "Графический\nДизайн",
            "x": 1050.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45,
        },
    ]

    for node_data in nodes_data:
        node = models.GraphNode(**node_data)
        db.add(node)

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
        hashed_password=get_password_hash("demo123"),
    )
    db.add(demo_user)

    admin_user = models.User(
        id=str(uuid.uuid4()),
        email="admin@graph.com",
        username="admin",
        full_name="Administrator",
        hashed_password=get_password_hash("admin"),
    )
    db.add(demo_user)

    user_course_1 = models.UserCourse(
        user_id=demo_user.id,
        course_id="product-intro",
        status=models.CourseStatus.in_progress,
        progress=35.0,
    )
    db.add(user_course_1)

    db.commit()
    print("✓ Демо-пользователь создан (username: demo, password: demo123)")
    print("✓ Администратор создан (username: admin, password: admin)")


def main():
    """Основная функция инициализации"""
    print("Начинаем инициализацию БД...")
    db = SessionLocal()

    try:
        existing_tracks = db.query(models.Track).count()
        if existing_tracks > 0:
            print("⚠ БД уже содержит данные. Пропускаем инициализацию.")
            print("Для переинициализации удалите БД и запустите скрипт снова.")
            return

        init_tracks(db)
        init_courses(db)
        init_modules_and_lessons(db)
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
