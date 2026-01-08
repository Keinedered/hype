"""
Скрипт инициализации БД с данными из mockData.ts
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
import uuid

# Создаем таблицы
Base.metadata.create_all(bind=engine)

# Создаем триггеры для синхронизации счетчиков
def create_triggers(engine):
    """Создание триггеров БД для автоматического обновления счетчиков"""
    with engine.connect() as connection:
        # Триггер при добавлении модуля
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_module_count_insert()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET module_count = (SELECT COUNT(*) FROM modules WHERE course_id = NEW.course_id)
            WHERE id = NEW.course_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Триггер при удалении модуля
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_module_count_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET module_count = (SELECT COUNT(*) FROM modules WHERE course_id = OLD.course_id)
            WHERE id = OLD.course_id;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Триггер при добавлении урока
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_lesson_count_insert()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET lesson_count = (
                SELECT COUNT(*) FROM lessons l 
                INNER JOIN modules m ON l.module_id = m.id 
                WHERE m.course_id = (SELECT course_id FROM modules WHERE id = NEW.module_id LIMIT 1)
            )
            WHERE id = (SELECT course_id FROM modules WHERE id = NEW.module_id LIMIT 1);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Триггер при удалении урока
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_lesson_count_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET lesson_count = (
                SELECT COUNT(*) FROM lessons l 
                INNER JOIN modules m ON l.module_id = m.id 
                WHERE m.course_id = (SELECT course_id FROM modules WHERE id = OLD.module_id LIMIT 1)
            )
            WHERE id = (SELECT course_id FROM modules WHERE id = OLD.module_id LIMIT 1);
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Триггер при добавлении задания (assignment)
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_task_count_insert()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET task_count = (
                SELECT COUNT(*) FROM assignments a 
                INNER JOIN lessons l ON a.lesson_id = l.id 
                INNER JOIN modules m ON l.module_id = m.id 
                WHERE m.course_id = (
                    SELECT m2.course_id FROM modules m2 
                    INNER JOIN lessons l2 ON m2.id = l2.module_id 
                    WHERE l2.id = NEW.lesson_id LIMIT 1
                )
            )
            WHERE id = (
                SELECT m.course_id FROM modules m 
                INNER JOIN lessons l ON m.id = l.module_id 
                WHERE l.id = NEW.lesson_id LIMIT 1
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Триггер при удалении задания
        connection.execute(text("""
        CREATE OR REPLACE FUNCTION update_course_task_count_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE courses 
            SET task_count = (
                SELECT COUNT(*) FROM assignments a 
                INNER JOIN lessons l ON a.lesson_id = l.id 
                INNER JOIN modules m ON l.module_id = m.id 
                WHERE m.course_id = (
                    SELECT m2.course_id FROM modules m2 
                    INNER JOIN lessons l2 ON m2.id = l2.module_id 
                    WHERE l2.id = OLD.lesson_id LIMIT 1
                )
            )
            WHERE id = (
                SELECT m.course_id FROM modules m 
                INNER JOIN lessons l ON m.id = l.module_id 
                WHERE l.id = OLD.lesson_id LIMIT 1
            );
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Создаем сами триггеры (если их еще нет)
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_module_count_insert ON modules;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_module_count_insert
        AFTER INSERT ON modules
        FOR EACH ROW
        EXECUTE FUNCTION update_course_module_count_insert();
        """))
        
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_module_count_delete ON modules;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_module_count_delete
        AFTER DELETE ON modules
        FOR EACH ROW
        EXECUTE FUNCTION update_course_module_count_delete();
        """))
        
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_lesson_count_insert ON lessons;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_lesson_count_insert
        AFTER INSERT ON lessons
        FOR EACH ROW
        EXECUTE FUNCTION update_course_lesson_count_insert();
        """))
        
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_lesson_count_delete ON lessons;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_lesson_count_delete
        AFTER DELETE ON lessons
        FOR EACH ROW
        EXECUTE FUNCTION update_course_lesson_count_delete();
        """))
        
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_task_count_insert ON assignments;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_task_count_insert
        AFTER INSERT ON assignments
        FOR EACH ROW
        EXECUTE FUNCTION update_course_task_count_insert();
        """))
        
        try:
            connection.execute(text("""
            DROP TRIGGER IF EXISTS trigger_update_task_count_delete ON assignments;
            """))
        except:
            pass
        
        connection.execute(text("""
        CREATE TRIGGER trigger_update_task_count_delete
        AFTER DELETE ON assignments
        FOR EACH ROW
        EXECUTE FUNCTION update_course_task_count_delete();
        """))
        
        connection.commit()
        print("✓ Триггеры БД созданы")


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
            "id": "design",
            "track_id": models.TrackIdEnum.design,
            "title": "Дизайн",
            "version": "v1.0",
            "description": "Фундаментальные принципы визуального дизайна",
            "short_description": "Композиция, цвет и типографика",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 15,
            "task_count": 18,
            "status": "published",
            "authors": ["Артём Соколов"]
        },
        {
            "id": "event-basics",
            "track_id": models.TrackIdEnum.event,
            "title": "Ивент",
            "version": "v1.0",
            "description": "Погружение в мир организации мероприятий: от концепции до пост-анализа",
            "short_description": "Научитесь планировать и проводить успешные мероприятия",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 12,
            "task_count": 15,
            "enrollment_deadline": "31 декабря 2025",
            "status": "published",
            "authors": ["Анна Смирнова", "Дмитрий Петров"]
        },
        {
            "id": "product-intro",
            "track_id": models.TrackIdEnum.digital,
            "title": "Цифровые продукты",
            "version": "v1.0",
            "description": "Основы работы продакт-менеджера: от идеи до запуска",
            "short_description": "Станьте продакт-менеджером цифрового продукта",
            "level": models.CourseLevel.beginner,
            "module_count": 4,
            "lesson_count": 18,
            "task_count": 22,
            "enrollment_deadline": "15 января 2026",
            "status": "published",
            "authors": ["Алексей Кузнецов", "Ольга Волкова"]
        },
        {
            "id": "business-comm",
            "track_id": models.TrackIdEnum.communication,
            "title": "Внешние коммуникации",
            "version": "v1.0",
            "description": "Эффективная деловая коммуникация в письменной форме",
            "short_description": "Email, мессенджеры и официальные письма",
            "level": models.CourseLevel.beginner,
            "module_count": 3,
            "lesson_count": 9,
            "task_count": 12,
            "status": "published",
            "authors": ["Наталья Морозова"]
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


def init_modules_and_lessons(db: Session):
    """Инициализация модулей и уроков для курсов"""
    modules_data = [
        # Дизайн
        {
            "id": "design-basics",
            "course_id": "design",
            "title": "Основы дизайна",
            "description": "Введение в принципы визуального дизайна",
            "order_index": 1
        },
        {
            "id": "design-composition",
            "course_id": "design",
            "title": "Композиция и баланс",
            "description": "Изучение композиционных принципов",
            "order_index": 2
        },
        {
            "id": "design-color",
            "course_id": "design",
            "title": "Цвет и типографика",
            "description": "Работа с цветом и шрифтами",
            "order_index": 3
        },
        # Ивент
        {
            "id": "event-planning",
            "course_id": "event-basics",
            "title": "Планирование мероприятий",
            "description": "Основы планирования и организации событий",
            "order_index": 1
        },
        {
            "id": "event-execution",
            "course_id": "event-basics",
            "title": "Проведение мероприятий",
            "description": "Практические аспекты проведения событий",
            "order_index": 2
        },
        {
            "id": "event-analysis",
            "course_id": "event-basics",
            "title": "Анализ результатов",
            "description": "Оценка эффективности мероприятий",
            "order_index": 3
        },
        # Цифровые продукты
        {
            "id": "product-intro-module",
            "course_id": "product-intro",
            "title": "Введение в продукт-менеджмент",
            "description": "Основы работы продакт-менеджера",
            "order_index": 1
        },
        {
            "id": "product-research",
            "course_id": "product-intro",
            "title": "Исследование рынка",
            "description": "Методы исследования и анализа рынка",
            "order_index": 2
        },
        {
            "id": "product-development",
            "course_id": "product-intro",
            "title": "Разработка продукта",
            "description": "Процесс разработки цифрового продукта",
            "order_index": 3
        },
        {
            "id": "product-launch",
            "course_id": "product-intro",
            "title": "Запуск продукта",
            "description": "Стратегии запуска и масштабирования",
            "order_index": 4
        },
        # Внешние коммуникации
        {
            "id": "comm-email",
            "course_id": "business-comm",
            "title": "Деловая переписка",
            "description": "Эффективная email-коммуникация",
            "order_index": 1
        },
        {
            "id": "comm-messengers",
            "course_id": "business-comm",
            "title": "Работа в мессенджерах",
            "description": "Профессиональная коммуникация в мессенджерах",
            "order_index": 2
        },
        {
            "id": "comm-official",
            "course_id": "business-comm",
            "title": "Официальные письма",
            "description": "Составление официальной документации",
            "order_index": 3
        }
    ]
    
    lessons_data = [
        # Дизайн - Основы дизайна (модуль 1)
        {
            "id": "design-intro",
            "module_id": "design-basics",
            "title": "Введение в дизайн",
            "description": "Что такое дизайн и его роль в современном мире",
            "order_index": 1,
            "content": "Дизайн - это процесс создания визуальных решений для решения проблем и улучшения пользовательского опыта.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "design-principles",
            "module_id": "design-basics",
            "title": "Основные принципы дизайна",
            "description": "Фундаментальные принципы визуального дизайна",
            "order_index": 2,
            "content": "Основные принципы включают: баланс, контраст, иерархию, ритм и единство.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "design-visual-elements",
            "module_id": "design-basics",
            "title": "Визуальные элементы",
            "description": "Линии, формы, текстуры и их применение",
            "order_index": 3,
            "content": "Визуальные элементы - это строительные блоки любого дизайна.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "design-grid-systems",
            "module_id": "design-basics",
            "title": "Сеточные системы",
            "description": "Использование сеток для структурирования контента",
            "order_index": 4,
            "content": "Сеточные системы помогают создавать организованные и сбалансированные макеты.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        # Дизайн - Композиция (модуль 2)
        {
            "id": "composition-basics",
            "module_id": "design-composition",
            "title": "Основы композиции",
            "description": "Правила построения композиции",
            "order_index": 1,
            "content": "Композиция - это расположение элементов в пространстве для создания визуальной гармонии.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "composition-balance",
            "module_id": "design-composition",
            "title": "Баланс в композиции",
            "description": "Симметричный и асимметричный баланс",
            "order_index": 2,
            "content": "Баланс создает стабильность и визуальную привлекательность композиции.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "composition-hierarchy",
            "module_id": "design-composition",
            "title": "Визуальная иерархия",
            "description": "Создание иерархии через размер, цвет и расположение",
            "order_index": 3,
            "content": "Визуальная иерархия направляет внимание пользователя к важным элементам.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "composition-whitespace",
            "module_id": "design-composition",
            "title": "Работа с белым пространством",
            "description": "Использование пустого пространства в дизайне",
            "order_index": 4,
            "content": "Белое пространство - это не пустота, а важный элемент дизайна.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        # Дизайн - Цвет и типографика (модуль 3)
        {
            "id": "color-theory",
            "module_id": "design-color",
            "title": "Теория цвета",
            "description": "Цветовой круг и цветовые схемы",
            "order_index": 1,
            "content": "Понимание теории цвета помогает создавать гармоничные цветовые палитры.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "color-psychology",
            "module_id": "design-color",
            "title": "Психология цвета",
            "description": "Как цвета влияют на восприятие и эмоции",
            "order_index": 2,
            "content": "Разные цвета вызывают разные эмоции и ассоциации.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "typography-basics",
            "module_id": "design-color",
            "title": "Основы типографики",
            "description": "Выбор и использование шрифтов",
            "order_index": 3,
            "content": "Типографика - это искусство оформления текста для улучшения читаемости.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "typography-pairing",
            "module_id": "design-color",
            "title": "Сочетание шрифтов",
            "description": "Правила сочетания различных шрифтов",
            "order_index": 4,
            "content": "Правильное сочетание шрифтов создает визуальную гармонию.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Планирование мероприятий (модуль 1)
        {
            "id": "event-planning-intro",
            "module_id": "event-planning",
            "title": "Введение в планирование",
            "description": "Основы планирования мероприятий",
            "order_index": 1,
            "content": "Планирование - это ключевой этап успешного мероприятия.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-goals",
            "module_id": "event-planning",
            "title": "Определение целей мероприятия",
            "description": "Как правильно формулировать цели события",
            "order_index": 2,
            "content": "Четкие цели помогают принимать правильные решения на всех этапах.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-budget",
            "module_id": "event-planning",
            "title": "Бюджетирование мероприятия",
            "description": "Планирование и контроль бюджета",
            "order_index": 3,
            "content": "Правильное бюджетирование - залог успешного мероприятия.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-timeline",
            "module_id": "event-planning",
            "title": "Создание таймлайна",
            "description": "Планирование временных рамок мероприятия",
            "order_index": 4,
            "content": "Детальный таймлайн помогает контролировать все процессы.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Проведение мероприятий (модуль 2)
        {
            "id": "event-preparation",
            "module_id": "event-execution",
            "title": "Подготовка к мероприятию",
            "description": "Финальная подготовка перед событием",
            "order_index": 1,
            "content": "Тщательная подготовка - основа успешного проведения.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-coordination",
            "module_id": "event-execution",
            "title": "Координация во время мероприятия",
            "description": "Управление процессом в реальном времени",
            "order_index": 2,
            "content": "Эффективная координация обеспечивает плавное проведение события.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-troubleshooting",
            "module_id": "event-execution",
            "title": "Решение проблем",
            "description": "Как справляться с непредвиденными ситуациями",
            "order_index": 3,
            "content": "Готовность к проблемам помогает быстро их решать.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Анализ результатов (модуль 3)
        {
            "id": "event-feedback",
            "module_id": "event-analysis",
            "title": "Сбор обратной связи",
            "description": "Методы сбора отзывов участников",
            "order_index": 1,
            "content": "Обратная связь помогает понять эффективность мероприятия.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-metrics",
            "module_id": "event-analysis",
            "title": "Метрики эффективности",
            "description": "Ключевые показатели успешности мероприятия",
            "order_index": 2,
            "content": "Метрики помогают оценить достижение целей мероприятия.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-report",
            "module_id": "event-analysis",
            "title": "Составление отчета",
            "description": "Как создать итоговый отчет о мероприятии",
            "order_index": 3,
            "content": "Отчет документирует результаты и извлеченные уроки.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Введение в продукт-менеджмент (модуль 1)
        {
            "id": "product-role",
            "module_id": "product-intro-module",
            "title": "Роль продакт-менеджера",
            "description": "Кто такой продакт-менеджер и чем он занимается",
            "order_index": 1,
            "content": "Продакт-менеджер отвечает за успех продукта на всех этапах его жизненного цикла.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-skills",
            "module_id": "product-intro-module",
            "title": "Навыки продакт-менеджера",
            "description": "Необходимые навыки для работы",
            "order_index": 2,
            "content": "Продакт-менеджеру нужны технические, аналитические и коммуникативные навыки.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-vision",
            "module_id": "product-intro-module",
            "title": "Видение продукта",
            "description": "Создание и формулирование видения продукта",
            "order_index": 3,
            "content": "Видение продукта направляет все решения и развитие.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-strategy",
            "module_id": "product-intro-module",
            "title": "Стратегия продукта",
            "description": "Разработка стратегии развития продукта",
            "order_index": 4,
            "content": "Стратегия определяет долгосрочные цели и пути их достижения.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Исследование рынка (модуль 2)
        {
            "id": "research-methods",
            "module_id": "product-research",
            "title": "Методы исследования",
            "description": "Основные методы исследования рынка и пользователей",
            "order_index": 1,
            "content": "Исследование помогает понять потребности пользователей и рынка.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "user-interviews",
            "module_id": "product-research",
            "title": "Интервью с пользователями",
            "description": "Проведение эффективных интервью",
            "order_index": 2,
            "content": "Интервью - один из лучших способов понять потребности пользователей.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "competitive-analysis",
            "module_id": "product-research",
            "title": "Анализ конкурентов",
            "description": "Изучение конкурентной среды",
            "order_index": 3,
            "content": "Анализ конкурентов помогает найти возможности для дифференциации.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "market-trends",
            "module_id": "product-research",
            "title": "Тренды рынка",
            "description": "Анализ текущих и будущих трендов",
            "order_index": 4,
            "content": "Понимание трендов помогает предвидеть изменения рынка.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Разработка продукта (модуль 3)
        {
            "id": "product-roadmap",
            "module_id": "product-development",
            "title": "Дорожная карта продукта",
            "description": "Создание и управление roadmap",
            "order_index": 1,
            "content": "Roadmap показывает путь развития продукта во времени.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-priorities",
            "module_id": "product-development",
            "title": "Приоритизация функций",
            "description": "Методы определения приоритетов",
            "order_index": 2,
            "content": "Правильная приоритизация помогает фокусироваться на важном.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-mvp",
            "module_id": "product-development",
            "title": "MVP и итерации",
            "description": "Создание минимально жизнеспособного продукта",
            "order_index": 3,
            "content": "MVP позволяет быстро проверить гипотезы с минимальными затратами.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-testing",
            "module_id": "product-development",
            "title": "Тестирование продукта",
            "description": "Методы тестирования перед запуском",
            "order_index": 4,
            "content": "Тестирование помогает выявить проблемы до запуска.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Запуск продукта (модуль 4)
        {
            "id": "launch-strategy",
            "module_id": "product-launch",
            "title": "Стратегия запуска",
            "description": "Планирование успешного запуска продукта",
            "order_index": 1,
            "content": "Правильная стратегия запуска определяет успех продукта.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "launch-marketing",
            "module_id": "product-launch",
            "title": "Маркетинг при запуске",
            "description": "Продвижение продукта на этапе запуска",
            "order_index": 2,
            "content": "Эффективный маркетинг привлекает первых пользователей.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "launch-monitoring",
            "module_id": "product-launch",
            "title": "Мониторинг после запуска",
            "description": "Отслеживание метрик и обратной связи",
            "order_index": 3,
            "content": "Мониторинг помогает быстро реагировать на проблемы.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "launch-iteration",
            "module_id": "product-launch",
            "title": "Итерации после запуска",
            "description": "Улучшение продукта на основе данных",
            "order_index": 4,
            "content": "Постоянные итерации улучшают продукт и удовлетворенность пользователей.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Внешние коммуникации - Деловая переписка (модуль 1)
        {
            "id": "email-basics",
            "module_id": "comm-email",
            "title": "Основы email-коммуникации",
            "description": "Правила деловой переписки",
            "order_index": 1,
            "content": "Email - основной инструмент деловой коммуникации в современном мире.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "email-structure",
            "module_id": "comm-email",
            "title": "Структура делового письма",
            "description": "Правильное оформление email",
            "order_index": 2,
            "content": "Правильная структура делает письмо понятным и профессиональным.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "email-tone",
            "module_id": "comm-email",
            "title": "Тон и стиль письма",
            "description": "Выбор подходящего тона для разных ситуаций",
            "order_index": 3,
            "content": "Тон письма влияет на восприятие и результат коммуникации.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        # Внешние коммуникации - Работа в мессенджерах (модуль 2)
        {
            "id": "messenger-etiquette",
            "module_id": "comm-messengers",
            "title": "Этикет в мессенджерах",
            "description": "Правила профессиональной коммуникации в мессенджерах",
            "order_index": 1,
            "content": "Профессиональный этикет в мессенджерах важен для эффективной работы.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "messenger-groups",
            "module_id": "comm-messengers",
            "title": "Работа в групповых чатах",
            "description": "Эффективная коммуникация в команде",
            "order_index": 2,
            "content": "Групповые чаты требуют особого подхода к коммуникации.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "messenger-async",
            "module_id": "comm-messengers",
            "title": "Асинхронная коммуникация",
            "description": "Управление асинхронными сообщениями",
            "order_index": 3,
            "content": "Асинхронная коммуникация требует правильного управления временем.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        # Внешние коммуникации - Официальные письма (модуль 3)
        {
            "id": "official-structure",
            "module_id": "comm-official",
            "title": "Структура официального письма",
            "description": "Правильное оформление официальной документации",
            "order_index": 1,
            "content": "Официальные письма требуют строгого соблюдения формата.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "official-language",
            "module_id": "comm-official",
            "title": "Язык официальных документов",
            "description": "Использование формального языка",
            "order_index": 2,
            "content": "Формальный язык обеспечивает точность и официальность.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "official-types",
            "module_id": "comm-official",
            "title": "Типы официальных писем",
            "description": "Различные виды официальной переписки",
            "order_index": 3,
            "content": "Разные типы писем требуют разных подходов к оформлению.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        }
    ]
    
    # Создаем модули (только если их еще нет)
    modules_created = 0
    modules_existing = 0
    for module_data in modules_data:
        existing = db.query(models.Module).filter(models.Module.id == module_data["id"]).first()
        if not existing:
            module = models.Module(**module_data)
            db.add(module)
            modules_created += 1
        else:
            modules_existing += 1
    
    db.commit()
    if modules_created > 0:
        print(f"✓ Модулей создано: {modules_created} (уже существовало: {modules_existing})")
    else:
        print(f"✓ Модули уже существуют: {modules_existing} (новых не создано)")
    
    # Создаем уроки (только если их еще нет)
    lessons_created = 0
    lessons_existing = 0
    for lesson_data in lessons_data:
        existing = db.query(models.Lesson).filter(models.Lesson.id == lesson_data["id"]).first()
        if not existing:
            lesson = models.Lesson(**lesson_data)
            db.add(lesson)
            lessons_created += 1
        else:
            lessons_existing += 1
    
    db.commit()
    if lessons_created > 0:
        print(f"✓ Уроков создано: {lessons_created} (уже существовало: {lessons_existing})")
    else:
        print(f"✓ Уроки уже существуют: {lessons_existing} (новых не создано)")
    
    # Создаем узлы графа для модулей (только если их еще нет)
    module_nodes_created = 0
    for module_data in modules_data:
        module = db.query(models.Module).filter(models.Module.id == module_data["id"]).first()
        if module:
            existing_node = db.query(models.GraphNode).filter(
                models.GraphNode.entity_id == module.id,
                models.GraphNode.type == models.NodeType.module
            ).first()
            if not existing_node:
                module_nodes_created += 1
                # Получаем курс для позиционирования
                course_node = db.query(models.GraphNode).filter(
                    models.GraphNode.entity_id == module.course_id,
                    models.GraphNode.type == models.NodeType.course
                ).first()
                
                if course_node:
                    # Позиционируем модули вокруг курса
                    import math
                    module_index = module.order_index - 1
                    angle = (2 * math.pi * module_index) / max(len([m for m in modules_data if m["course_id"] == module.course_id]), 1)
                    radius = 120.0
                    x = course_node.x + radius * math.cos(angle)
                    y = course_node.y + radius * math.sin(angle)
                else:
                    x = 500.0
                    y = 500.0
                
                module_node = models.GraphNode(
                    id=f"node-{module.id}",
                    type=models.NodeType.module,
                    entity_id=module.id,
                    title=module.title,
                    x=x,
                    y=y,
                    status=models.NodeStatus.open,
                    size=40
                )
                db.add(module_node)
                
                # Создаем связь с курсом
                if course_node:
                    existing_edge = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == course_node.id,
                        models.GraphEdge.target_id == module_node.id
                    ).first()
                    if not existing_edge:
                        edge = models.GraphEdge(
                            id=f"edge-{course_node.id}-{module_node.id}",
                            source_id=course_node.id,
                            target_id=module_node.id,
                            type=models.EdgeType.required
                        )
                        db.add(edge)
    
    # Создаем узлы графа для уроков (только если их еще нет)
    lesson_nodes_created = 0
    for lesson_data in lessons_data:
        lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_data["id"]).first()
        if lesson and lesson.module_id:
            existing_node = db.query(models.GraphNode).filter(
                models.GraphNode.entity_id == lesson.id,
                models.GraphNode.type == models.NodeType.lesson
            ).first()
            if not existing_node:
                lesson_nodes_created += 1
                # Получаем модуль для позиционирования
                module_node = db.query(models.GraphNode).filter(
                    models.GraphNode.entity_id == lesson.module_id,
                    models.GraphNode.type == models.NodeType.module
                ).first()
                
                if module_node:
                    # Позиционируем уроки вокруг модуля
                    import math
                    module_lessons = [l for l in lessons_data if l["module_id"] == lesson.module_id]
                    lesson_index = next((i for i, l in enumerate(module_lessons) if l["id"] == lesson.id), 0)
                    angle = (2 * math.pi * lesson_index) / max(len(module_lessons), 1)
                    radius = 100.0
                    x = module_node.x + radius * math.cos(angle)
                    y = module_node.y + radius * math.sin(angle)
                else:
                    x = 500.0
                    y = 500.0
                
                lesson_node = models.GraphNode(
                    id=f"node-{lesson.id}",
                    type=models.NodeType.lesson,
                    entity_id=lesson.id,
                    title=lesson.title,
                    x=x,
                    y=y,
                    status=models.NodeStatus.open,
                    size=35
                )
                db.add(lesson_node)
                
                # Создаем связь с модулем
                if module_node:
                    existing_edge = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == module_node.id,
                        models.GraphEdge.target_id == lesson_node.id
                    ).first()
                    if not existing_edge:
                        edge = models.GraphEdge(
                            id=f"edge-{module_node.id}-{lesson_node.id}",
                            source_id=module_node.id,
                            target_id=lesson_node.id,
                            type=models.EdgeType.required
                        )
                        db.add(edge)
    
    db.commit()
    if module_nodes_created > 0 or lesson_nodes_created > 0:
        print(f"✓ Узлы графа созданы: модулей {module_nodes_created}, уроков {lesson_nodes_created}")
    else:
        print(f"✓ Узлы графа уже существуют (новых не создано)")


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
            "id": "node-design",
            "type": models.NodeType.course,
            "entity_id": "design",
            "title": "Дизайн",
            "x": 550.0,
            "y": 300.0,
            "status": models.NodeStatus.completed,
            "size": 45
        },
        {
            "id": "node-event-basics",
            "type": models.NodeType.course,
            "entity_id": "event-basics",
            "title": "Ивент",
            "x": 1050.0,
            "y": 300.0,
            "status": models.NodeStatus.current,
            "size": 45
        },
        {
            "id": "node-product-intro",
            "type": models.NodeType.course,
            "entity_id": "product-intro",
            "title": "Цифровые\\nпродукты",
            "x": 550.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45
        },
        {
            "id": "node-business-comm",
            "type": models.NodeType.course,
            "entity_id": "business-comm",
            "title": "Внешние\\nкоммуникации",
            "x": 1050.0,
            "y": 700.0,
            "status": models.NodeStatus.open,
            "size": 45
        }
    ]
    
    # Создаем узлы графа только если их еще нет
    nodes_created = 0
    nodes_existing = 0
    for node_data in nodes_data:
        existing = db.query(models.GraphNode).filter(models.GraphNode.id == node_data["id"]).first()
        if not existing:
            node = models.GraphNode(**node_data)
            db.add(node)
            nodes_created += 1
        else:
            nodes_existing += 1
    
    # Ребра графа (от root к курсам)
    edges_data = [
        {"id": "e1", "source_id": "root", "target_id": "node-design", "type": models.EdgeType.required},
        {"id": "e2", "source_id": "root", "target_id": "node-event-basics", "type": models.EdgeType.required},
        {"id": "e3", "source_id": "root", "target_id": "node-product-intro", "type": models.EdgeType.required},
        {"id": "e4", "source_id": "root", "target_id": "node-business-comm", "type": models.EdgeType.required},
    ]
    
    # Создаем edges только если их еще нет
    edges_created = 0
    edges_existing = 0
    for edge_data in edges_data:
        existing = db.query(models.GraphEdge).filter(
            models.GraphEdge.source_id == edge_data["source_id"],
            models.GraphEdge.target_id == edge_data["target_id"]
        ).first()
        if not existing:
            edge = models.GraphEdge(**edge_data)
            db.add(edge)
            edges_created += 1
        else:
            edges_existing += 1
    
    db.commit()
    if nodes_created > 0 or edges_created > 0:
        print(f"✓ Граф обновлен: создано {nodes_created} узлов, {edges_created} ребер (существовало: {nodes_existing} узлов, {edges_existing} ребер)")
    else:
        print(f"✓ Граф уже существует: {nodes_existing} узлов, {edges_existing} ребер")


def init_demo_user(db: Session):
    """Создание демо-пользователя и админа"""
    # Проверяем существование пользователей
    existing_demo = db.query(models.User).filter(models.User.username == "demo").first()
    existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
    
    if not existing_demo:
        demo_user = models.User(
            id=str(uuid.uuid4()),
            email="demo@graph.com",
            username="demo",
            full_name="Demo User",
            hashed_password=get_password_hash("demo123"),
            role=models.UserRole.student
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
        print(f"✓ Демо-пользователь создан (username: demo, password: demo123)")
    else:
        print(f"✓ Демо-пользователь уже существует")
    
    if not existing_admin:
        admin_user = models.User(
            id=str(uuid.uuid4()),
            email="admin@graph.com",
            username="admin",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role=models.UserRole.admin
        )
        db.add(admin_user)
        print(f"✓ Админ пользователь создан (username: admin, password: admin123)")
    else:
        print(f"✓ Админ пользователь уже существует")
    
    db.commit()


def main():
    """Основная функция инициализации"""
    import time
    import sys
    
    print("=" * 60)
    print("🚀 Инициализация базы данных GRAPH Educational Platform")
    print("=" * 60)
    
    # Небольшая задержка для гарантии готовности БД
    time.sleep(2)
    
    db = SessionLocal()
    
    try:
        # Проверяем подключение к БД
        db.execute(text("SELECT 1"))
        print("✅ Подключение к базе данных установлено")
        
        # Проверяем, есть ли уже данные
        existing_tracks = db.query(models.Track).count()
        if existing_tracks > 0:
            print("⚠ БД уже содержит данные. Пропускаем инициализацию.")
            print("Для переинициализации удалите volume и запустите снова:")
            print("  docker-compose down -v")
            print("  docker-compose up -d")
            return
        
        print("\n📦 Создание таблиц...")
        # Таблицы уже созданы в main.py, но убедимся
        Base.metadata.create_all(bind=engine)
        print("✅ Таблицы готовы")
        
        print("\n⚙️ Создание триггеров БД...")
        create_triggers(engine)
        print("✅ Триггеры готовы")
        
        print("\n📚 Инициализация данных...")
        init_tracks(db)
        init_courses(db)
        # Сначала создаем узлы графа для курсов, если их еще нет
        courses = db.query(models.Course).all()
        for course in courses:
            existing_node = db.query(models.GraphNode).filter(
                models.GraphNode.entity_id == course.id,
                models.GraphNode.type == models.NodeType.course
            ).first()
            if not existing_node:
                # Используем функцию из crud для создания узла курса
                from crud import create_graph_node_for_course
                create_graph_node_for_course(db, course)
        db.commit()
        
        init_modules_and_lessons(db)
        init_graph(db)  # init_graph создает root и edges от root к курсам
        init_demo_user(db)
        
        print("\n" + "=" * 60)
        print("✅ Инициализация БД завершена успешно!")
        print("=" * 60)
        print("\n👤 Учетные записи для входа:")
        print("\n  📘 Демо пользователь (студент):")
        print("     Username: demo")
        print("     Password: demo123")
        print("     Email: demo@graph.com")
        print("\n  🔐 Админ пользователь:")
        print("     Username: admin")
        print("     Password: admin123")
        print("     Email: admin@graph.com")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Ошибка при инициализации: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

