"""
Скрипт для добавления модулей и уроков в базу данных
Добавляет модули в курсы и уроки в модули
"""
import sys
import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import datetime
from routers.utils import update_course_module_count, update_course_lesson_count, safe_commit

def add_modules_and_lessons(db: Session):
    """Добавление модулей и уроков в БД"""
    
    # Проверяем, что курсы существуют
    courses = db.query(models.Course).all()
    if not courses:
        print("❌ Ошибка: Курсы не найдены в БД. Сначала запустите init_db.py")
        return False
    
    course_ids = {course.id for course in courses}
    print(f"✓ Найдено курсов: {len(courses)}")
    
    modules_data = [
        # Дизайн (course_id: "design")
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
        # Ивент (course_id: "event-basics")
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
        # Цифровые продукты (course_id: "product-intro")
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
        # Внешние коммуникации (course_id: "business-comm")
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
    
    # Добавляем модули
    modules_added = 0
    modules_updated = 0
    for module_data in modules_data:
        if module_data["course_id"] not in course_ids:
            print(f"⚠️  Пропуск модуля {module_data['id']}: курс {module_data['course_id']} не найден")
            continue
        
        existing_module = db.query(models.Module).filter(models.Module.id == module_data["id"]).first()
        if existing_module:
            # Обновляем существующий модуль
            for key, value in module_data.items():
                setattr(existing_module, key, value)
            modules_updated += 1
        else:
            # Создаем новый модуль
            module = models.Module(**module_data)
            db.add(module)
            modules_added += 1
            # Обновляем счетчик модулей в курсе
            try:
                update_course_module_count(db, module_data["course_id"])
            except Exception as e:
                print(f"⚠️  Предупреждение при обновлении счетчика модулей: {e}")
    
    safe_commit(db, "add_modules")
    print(f"✓ Модулей добавлено: {modules_added}, обновлено: {modules_updated}")
    
    # Данные для уроков
    lessons_data = [
        # Дизайн - Основы дизайна
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
        # Дизайн - Композиция
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
        # Дизайн - Цвет и типографика
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
            "id": "typography-basics",
            "module_id": "design-color",
            "title": "Основы типографики",
            "description": "Работа со шрифтами и текстом",
            "order_index": 2,
            "content": "Типографика - это искусство оформления текста для улучшения читаемости.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Планирование
        {
            "id": "event-planning-intro",
            "module_id": "event-planning",
            "title": "Введение в планирование мероприятий",
            "description": "Основы планирования событий",
            "order_index": 1,
            "content": "Планирование - это первый и самый важный этап организации мероприятия.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "event-budget",
            "module_id": "event-planning",
            "title": "Бюджетирование мероприятий",
            "description": "Планирование и управление бюджетом",
            "order_index": 2,
            "content": "Правильное бюджетирование - ключ к успешному мероприятию.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Проведение
        {
            "id": "event-day-management",
            "module_id": "event-execution",
            "title": "Управление в день мероприятия",
            "description": "Координация и управление во время события",
            "order_index": 1,
            "content": "Эффективное управление в день мероприятия требует тщательной подготовки.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Ивент - Анализ
        {
            "id": "event-metrics",
            "module_id": "event-analysis",
            "title": "Метрики успеха мероприятий",
            "description": "Ключевые показатели эффективности",
            "order_index": 1,
            "content": "Измерение результатов помогает улучшить будущие мероприятия.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Введение
        {
            "id": "product-role",
            "module_id": "product-intro-module",
            "title": "Роль продакт-менеджера",
            "description": "Обязанности и навыки продакт-менеджера",
            "order_index": 1,
            "content": "Продакт-менеджер связывает бизнес, пользователей и разработку.",
            "estimated_time": 40,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "product-lifecycle",
            "module_id": "product-intro-module",
            "title": "Жизненный цикл продукта",
            "description": "Этапы развития цифрового продукта",
            "order_index": 2,
            "content": "Понимание жизненного цикла помогает принимать правильные решения.",
            "estimated_time": 45,
            "content_type": "text",
            "status": "published"
        },
        # Цифровые продукты - Исследование
        {
            "id": "market-research",
            "module_id": "product-research",
            "title": "Исследование рынка",
            "description": "Методы анализа рынка и конкурентов",
            "order_index": 1,
            "content": "Глубокое понимание рынка - основа успешного продукта.",
            "estimated_time": 50,
            "content_type": "text",
            "status": "published"
        },
        # Внешние коммуникации - Email
        {
            "id": "email-etiquette",
            "module_id": "comm-email",
            "title": "Этикет деловой переписки",
            "description": "Правила профессиональной email-коммуникации",
            "order_index": 1,
            "content": "Правильная переписка создает профессиональный имидж.",
            "estimated_time": 30,
            "content_type": "text",
            "status": "published"
        },
        {
            "id": "email-structure",
            "module_id": "comm-email",
            "title": "Структура делового письма",
            "description": "Как правильно структурировать email",
            "order_index": 2,
            "content": "Четкая структура помогает донести сообщение эффективно.",
            "estimated_time": 35,
            "content_type": "text",
            "status": "published"
        },
        # Внешние коммуникации - Мессенджеры
        {
            "id": "messenger-rules",
            "module_id": "comm-messengers",
            "title": "Правила работы в мессенджерах",
            "description": "Профессиональная коммуникация в чатах",
            "order_index": 1,
            "content": "Мессенджеры требуют особого подхода к коммуникации.",
            "estimated_time": 25,
            "content_type": "text",
            "status": "published"
        }
    ]
    
    # Добавляем уроки
    lessons_added = 0
    lessons_updated = 0
    
    # Получаем все модули для проверки
    all_modules = {m.id: m for m in db.query(models.Module).all()}
    
    for lesson_data in lessons_data:
        module_id = lesson_data["module_id"]
        if module_id not in all_modules:
            print(f"⚠️  Пропуск урока {lesson_data['id']}: модуль {module_id} не найден")
            continue
        
        existing_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_data["id"]).first()
        if existing_lesson:
            # Обновляем существующий урок
            for key, value in lesson_data.items():
                if key != "module_id":  # module_id уже установлен
                    setattr(existing_lesson, key, value)
            existing_lesson.module_id = module_id
            lessons_updated += 1
        else:
            # Создаем новый урок
            lesson = models.Lesson(**lesson_data)
            if lesson.status == "published":
                lesson.published_at = datetime.utcnow()
            db.add(lesson)
            lessons_added += 1
            
            # Обновляем счетчик уроков в курсе через модуль
            module = all_modules[module_id]
            try:
                update_course_lesson_count(db, module.course_id)
            except Exception as e:
                print(f"⚠️  Предупреждение при обновлении счетчика уроков: {e}")
    
    safe_commit(db, "add_lessons")
    print(f"✓ Уроков добавлено: {lessons_added}, обновлено: {lessons_updated}")
    
    return True


def main():
    """Основная функция"""
    print("=" * 50)
    print("📚 Добавление модулей и уроков в БД")
    print("=" * 50)
    print()
    
    db = SessionLocal()
    try:
        success = add_modules_and_lessons(db)
        if success:
            print()
            print("=" * 50)
            print("✅ Скрипт успешно выполнен!")
            print("=" * 50)
        else:
            print()
            print("=" * 50)
            print("❌ Скрипт завершился с ошибками")
            print("=" * 50)
            sys.exit(1)
    except Exception as e:
        print()
        print("=" * 50)
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

