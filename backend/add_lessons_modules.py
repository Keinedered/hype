"""
Скрипт для добавления дополнительных уроков и модулей в БД
Запуск: python backend/add_lessons_modules.py
"""
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys
import traceback


def add_modules_and_lessons(db: Session):
    """Добавление модулей и уроков в БД (только тех, которых еще нет)"""
    
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
    
    return {
        "modules_created": modules_created,
        "modules_existing": modules_existing,
        "lessons_created": lessons_created,
        "lessons_existing": lessons_existing
    }


def main():
    """Основная функция"""
    print("=" * 60)
    print("📚 Добавление модулей и уроков в базу данных")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        result = add_modules_and_lessons(db)
        
        print("\n" + "=" * 60)
        print("✅ Операция завершена успешно!")
        print("=" * 60)
        print(f"\n📊 Итоги:")
        print(f"   Модулей: создано {result['modules_created']}, уже было {result['modules_existing']}")
        print(f"   Уроков: создано {result['lessons_created']}, уже было {result['lessons_existing']}")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Ошибка при добавлении данных: {e}")
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

