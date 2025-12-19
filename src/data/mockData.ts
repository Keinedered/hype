import { Track, Course, Module, Lesson, GraphNode, GraphEdge } from '../types';

export const tracks: Track[] = [
  {
    id: 'event',
    name: 'Ивент',
    description: 'Организация мероприятий и управление событиями',
    color: '#E2B6C8'
  },
  {
    id: 'digital',
    name: 'Цифровые продукты',
    description: 'Product management и продуктовая аналитика',
    color: '#B6E2C8'
  },
  {
    id: 'communication',
    name: 'Внешние коммуникации',
    description: 'Деловая коммуникация и внешние связи',
    color: '#B6C8E2'
  },
  {
    id: 'design',
    name: 'Дизайн',
    description: 'Графический и продуктовый дизайн',
    color: '#C8B6E2'
  }
];

export const courses: Course[] = [
  {
    id: 'event-basics',
    trackId: 'event',
    title: 'Основы ивент-менеджмента',
    version: 'v1.0',
    description: 'Погружение в мир организации мероприятий: от концепции до пост-анализа',
    shortDescription: 'Научитесь планировать и проводить успешные мероприятия',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 12,
    taskCount: 15,
    authors: ['Анна Смирнова', 'Дмитрий Петров'],
    enrollmentDeadline: '31 декабря 2025',
    status: 'not_started'
  },
  {
    id: 'event-offline',
    trackId: 'event',
    title: 'Организация офлайн-мероприятий',
    version: 'v1.1',
    description: 'Практические навыки организации офлайн-событий любого масштаба',
    shortDescription: 'От камерных встреч до крупных конференций',
    level: 'intermediate',
    moduleCount: 4,
    lessonCount: 16,
    taskCount: 20,
    authors: ['Мария Иванова'],
    status: 'not_started' // Not started because basics not started
  },
  {
    id: 'product-intro',
    trackId: 'digital',
    title: 'Введение в продуктовый менеджмент',
    version: 'v1.0',
    description: 'Основы работы продакт-менеджера: от идеи до запуска',
    shortDescription: 'Станьте продакт-менеджером цифрового продукта',
    level: 'beginner',
    moduleCount: 4,
    lessonCount: 18,
    taskCount: 22,
    authors: ['Алексей Кузнецов', 'Ольга Волкова'],
    enrollmentDeadline: '15 января 2026',
    progress: 35,
    status: 'in_progress'
  },
  {
    id: 'cjm-course',
    trackId: 'digital',
    title: 'Карта пользовательского пути и CJM',
    version: 'v1.2',
    description: 'Глубокое погружение в построение Customer Journey Map',
    shortDescription: 'Научитесь понимать путь вашего пользователя',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 10,
    taskCount: 12,
    authors: ['Екатерина Сидорова'],
    status: 'not_started' // Not started yet, available after intro completion
  },
  {
    id: 'business-comm',
    trackId: 'communication',
    title: 'Основы деловой переписки',
    version: 'v1.0',
    description: 'Эффективная деловая коммуникация в письменной форме',
    shortDescription: 'Email, мессенджеры и официальные письма',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 9,
    taskCount: 12,
    authors: ['Наталья Морозова'],
    status: 'not_started'
  },
  {
    id: 'external-comm',
    trackId: 'communication',
    title: 'Внешние коммуникации компании',
    version: 'v1.1',
    description: 'Построение эффективной системы внешних коммуникаций',
    shortDescription: 'PR, медиа и работа с общественностью',
    level: 'intermediate',
    moduleCount: 5,
    lessonCount: 20,
    taskCount: 25,
    authors: ['Игорь Белов', 'Светлана Новикова'],
    enrollmentDeadline: '20 января 2026',
    progress: 100,
    status: 'completed'
  },
  {
    id: 'graphic-design',
    trackId: 'design',
    title: 'Основы графического дизайна',
    version: 'v1.0',
    description: 'Фундаментальные принципы визуального дизайна',
    shortDescription: 'Композиция, цвет и типографика',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 15,
    taskCount: 18,
    authors: ['Артём Соколов'],
    status: 'not_started'
  },
  {
    id: 'product-design',
    trackId: 'design',
    title: 'Продуктовый дизайн и интерфейсы',
    version: 'v1.3',
    description: 'UX/UI дизайн цифровых продуктов',
    shortDescription: 'От исследований до прототипирования',
    level: 'intermediate',
    moduleCount: 4,
    lessonCount: 17,
    taskCount: 20,
    authors: ['Юлия Романова', 'Павел Козлов'],
    progress: 60,
    status: 'in_progress'
  },
  // Additional Event courses
  {
    id: 'event-online',
    trackId: 'event',
    title: 'Организация онлайн-мероприятий',
    version: 'v1.0',
    description: 'Современные инструменты и платформы для онлайн-событий',
    shortDescription: 'Веб-конференции, стримы и виртуальные выставки',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 14,
    taskCount: 18,
    authors: ['Дмитрий Петров'],
    status: 'not_started'
  },
  {
    id: 'event-budget',
    trackId: 'event',
    title: 'Бюджетирование ивентов',
    version: 'v1.0',
    description: 'Финансовое планирование и контроль бюджета мероприятий',
    shortDescription: 'Расчет затрат и оптимизация бюджета',
    level: 'advanced',
    moduleCount: 4,
    lessonCount: 16,
    taskCount: 20,
    authors: ['Анна Смирнова'],
    status: 'not_started'
  },
  // Additional Digital courses
  {
    id: 'product-metrics',
    trackId: 'digital',
    title: 'Метрики продукта',
    version: 'v1.0',
    description: 'Ключевые метрики и их анализ для продуктовых решений',
    shortDescription: 'North Star Metric, воронки и когорты',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 12,
    taskCount: 15,
    authors: ['Алексей Кузнецов'],
    status: 'not_started'
  },
  {
    id: 'product-launch',
    trackId: 'digital',
    title: 'Запуск продукта',
    version: 'v1.0',
    description: 'Go-to-Market стратегия и запуск продукта на рынок',
    shortDescription: 'От MVP до масштабирования',
    level: 'advanced',
    moduleCount: 5,
    lessonCount: 20,
    taskCount: 25,
    authors: ['Ольга Волкова', 'Алексей Кузнецов'],
    status: 'not_started'
  },
  {
    id: 'user-research',
    trackId: 'digital',
    title: 'Пользовательские исследования',
    version: 'v1.0',
    description: 'Методы исследования пользователей и их потребностей',
    shortDescription: 'Интервью, опросы и анализ данных',
    level: 'beginner',
    moduleCount: 4,
    lessonCount: 16,
    taskCount: 20,
    authors: ['Екатерина Сидорова'],
    status: 'not_started'
  },
  // Additional Communication courses
  {
    id: 'presentation-skills',
    trackId: 'communication',
    title: 'Навыки презентации',
    version: 'v1.0',
    description: 'Эффективные презентации для бизнеса и аудитории',
    shortDescription: 'Структура, визуализация и публичные выступления',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 12,
    taskCount: 15,
    authors: ['Наталья Морозова'],
    status: 'not_started'
  },
  {
    id: 'crisis-comm',
    trackId: 'communication',
    title: 'Кризисные коммуникации',
    version: 'v1.0',
    description: 'Управление коммуникациями в кризисных ситуациях',
    shortDescription: 'Стратегии и инструменты кризисного PR',
    level: 'advanced',
    moduleCount: 4,
    lessonCount: 18,
    taskCount: 22,
    authors: ['Игорь Белов'],
    status: 'not_started'
  },
  {
    id: 'media-relations',
    trackId: 'communication',
    title: 'Работа со СМИ',
    version: 'v1.0',
    description: 'Построение отношений с медиа и работа с журналистами',
    shortDescription: 'Пресс-релизы, интервью и медиа-киты',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 14,
    taskCount: 18,
    authors: ['Светлана Новикова'],
    status: 'not_started'
  },
  // Additional Design courses
  {
    id: 'ui-fundamentals',
    trackId: 'design',
    title: 'Основы UI дизайна',
    version: 'v1.0',
    description: 'Фундаментальные принципы проектирования интерфейсов',
    shortDescription: 'Композиция, типографика и цвет в интерфейсах',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 14,
    taskCount: 18,
    authors: ['Артём Соколов'],
    status: 'not_started'
  },
  {
    id: 'design-systems',
    trackId: 'design',
    title: 'Дизайн-системы',
    version: 'v1.0',
    description: 'Создание и поддержка дизайн-систем для продуктов',
    shortDescription: 'Компоненты, стили и документация',
    level: 'advanced',
    moduleCount: 4,
    lessonCount: 18,
    taskCount: 22,
    authors: ['Юлия Романова'],
    status: 'not_started'
  },
  {
    id: 'prototyping',
    trackId: 'design',
    title: 'Прототипирование интерфейсов',
    version: 'v1.0',
    description: 'Создание интерактивных прототипов и их тестирование',
    shortDescription: 'Figma, принципы и пользовательское тестирование',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 15,
    taskCount: 18,
    authors: ['Павел Козлов'],
    status: 'not_started'
  }
];

export const modules: Module[] = [
  {
    id: 'pm-intro-1',
    courseId: 'product-intro',
    title: 'Роль продукта',
    description: 'Понимание роли продукта в бизнесе и команде',
    lessons: [],
    progress: 80
  },
  {
    id: 'pm-intro-2',
    courseId: 'product-intro',
    title: 'Исследования',
    description: 'Методы пользовательских исследований',
    lessons: [],
    progress: 45
  },
  {
    id: 'pm-intro-3',
    courseId: 'product-intro',
    title: 'Постановка задач и метрик',
    description: 'Формулирование задач и определение метрик успеха',
    lessons: [],
    progress: 0
  },
  {
    id: 'pm-intro-4',
    courseId: 'product-intro',
    title: 'Запуск и оценка',
    description: 'Процесс запуска продукта и оценка результатов',
    lessons: [],
    progress: 0
  }
];

export const graphNodes: GraphNode[] = [
  // Root Node
  {
    id: 'root',
    type: 'concept',
    entityId: 'root',
    title: 'АКАДЕМИЯ\nGRAPH',
    x: 500,
    y: 300,
    status: 'completed',
    size: 70
  },
  
  // Event Track
  {
    id: 'event-basics',
    type: 'lesson',
    entityId: 'event-basics',
    title: 'Основы\nИвент-менеджмента',
    x: 250,
    y: 150,
    status: 'available',
    size: 50
  },
  {
    id: 'event-offline',
    type: 'lesson',
    entityId: 'event-offline',
    title: 'Организация\nофлайн-мероприятий',
    x: 100,
    y: 100,
    status: 'locked',
    size: 45
  },

  // Digital Track
  {
    id: 'product-intro',
    type: 'lesson',
    entityId: 'product-intro',
    title: 'Введение в\nПродукт',
    x: 750,
    y: 150,
    status: 'current', // In progress
    size: 50
  },
  {
    id: 'cjm-course',
    type: 'lesson',
    entityId: 'cjm-course',
    title: 'CJM и\nПуть пользователя',
    x: 900,
    y: 100,
    status: 'available',
    size: 45
  },

  // Communication Track
  {
    id: 'business-comm',
    type: 'lesson',
    entityId: 'business-comm',
    title: 'Деловая\nПереписка',
    x: 250,
    y: 450,
    status: 'available',
    size: 50
  },
  {
    id: 'external-comm',
    type: 'lesson',
    entityId: 'external-comm',
    title: 'Внешние\nКоммуникации',
    x: 100,
    y: 500,
    status: 'completed', // Completed
    size: 45
  },

  // Design Track
  {
    id: 'graphic-design',
    type: 'lesson',
    entityId: 'graphic-design',
    title: 'Графический\nДизайн',
    x: 750,
    y: 450,
    status: 'available',
    size: 50
  },
  {
    id: 'product-design',
    type: 'lesson',
    entityId: 'product-design',
    title: 'Продуктовый\nДизайн',
    x: 900,
    y: 500,
    status: 'current', // In progress
    size: 45
  },
  // Additional Event nodes
  {
    id: 'event-online',
    type: 'course',
    entityId: 'event-online',
    title: 'Онлайн\nМероприятия',
    x: 150,
    y: 200,
    status: 'available',
    size: 45
  },
  {
    id: 'event-budget',
    type: 'course',
    entityId: 'event-budget',
    title: 'Бюджетирование\nИвентов',
    x: 50,
    y: 250,
    status: 'locked',
    size: 40
  },
  // Additional Digital nodes
  {
    id: 'product-metrics',
    type: 'course',
    entityId: 'product-metrics',
    title: 'Метрики\nПродукта',
    x: 850,
    y: 200,
    status: 'available',
    size: 45
  },
  {
    id: 'product-launch',
    type: 'course',
    entityId: 'product-launch',
    title: 'Запуск\nПродукта',
    x: 1000,
    y: 250,
    status: 'locked',
    size: 40
  },
  {
    id: 'user-research',
    type: 'course',
    entityId: 'user-research',
    title: 'Исследования\nПользователей',
    x: 800,
    y: 100,
    status: 'available',
    size: 45
  },
  // Additional Communication nodes
  {
    id: 'presentation-skills',
    type: 'course',
    entityId: 'presentation-skills',
    title: 'Навыки\nПрезентации',
    x: 150,
    y: 500,
    status: 'available',
    size: 45
  },
  {
    id: 'crisis-comm',
    type: 'course',
    entityId: 'crisis-comm',
    title: 'Кризисные\nКоммуникации',
    x: 50,
    y: 550,
    status: 'locked',
    size: 40
  },
  {
    id: 'media-relations',
    type: 'course',
    entityId: 'media-relations',
    title: 'Работа\nсо СМИ',
    x: 200,
    y: 600,
    status: 'available',
    size: 45
  },
  // Additional Design nodes
  {
    id: 'ui-fundamentals',
    type: 'course',
    entityId: 'ui-fundamentals',
    title: 'Основы\nUI Дизайна',
    x: 850,
    y: 500,
    status: 'available',
    size: 45
  },
  {
    id: 'design-systems',
    type: 'course',
    entityId: 'design-systems',
    title: 'Дизайн\nСистемы',
    x: 1000,
    y: 550,
    status: 'locked',
    size: 40
  },
  {
    id: 'prototyping',
    type: 'course',
    entityId: 'prototyping',
    title: 'Прототипирование\nИнтерфейсов',
    x: 800,
    y: 600,
    status: 'available',
    size: 45
  }
];

export const graphEdges: GraphEdge[] = [
  // Links from Root to Basics
  {
    id: 'e1',
    sourceId: 'root',
    targetId: 'event-basics',
    type: 'required'
  },
  {
    id: 'e2',
    sourceId: 'root',
    targetId: 'product-intro',
    type: 'required'
  },
  {
    id: 'e3',
    sourceId: 'root',
    targetId: 'business-comm',
    type: 'required'
  },
  {
    id: 'e4',
    sourceId: 'root',
    targetId: 'graphic-design',
    type: 'required'
  },

  // Links within tracks
  {
    id: 'e5',
    sourceId: 'event-basics',
    targetId: 'event-offline',
    type: 'required'
  },
  {
    id: 'e6',
    sourceId: 'product-intro',
    targetId: 'cjm-course',
    type: 'recommended'
  },
  {
    id: 'e7',
    sourceId: 'business-comm',
    targetId: 'external-comm',
    type: 'required'
  },
  {
    id: 'e8',
    sourceId: 'graphic-design',
    targetId: 'product-design',
    type: 'required'
  },
  // Additional Event edges
  {
    id: 'e9',
    sourceId: 'event-basics',
    targetId: 'event-online',
    type: 'recommended'
  },
  {
    id: 'e10',
    sourceId: 'event-offline',
    targetId: 'event-budget',
    type: 'required'
  },
  // Additional Digital edges
  {
    id: 'e11',
    sourceId: 'product-intro',
    targetId: 'product-metrics',
    type: 'recommended'
  },
  {
    id: 'e12',
    sourceId: 'cjm-course',
    targetId: 'user-research',
    type: 'recommended'
  },
  {
    id: 'e13',
    sourceId: 'product-metrics',
    targetId: 'product-launch',
    type: 'required'
  },
  // Additional Communication edges
  {
    id: 'e14',
    sourceId: 'business-comm',
    targetId: 'presentation-skills',
    type: 'recommended'
  },
  {
    id: 'e15',
    sourceId: 'external-comm',
    targetId: 'media-relations',
    type: 'recommended'
  },
  {
    id: 'e16',
    sourceId: 'media-relations',
    targetId: 'crisis-comm',
    type: 'required'
  },
  // Additional Design edges
  {
    id: 'e17',
    sourceId: 'graphic-design',
    targetId: 'ui-fundamentals',
    type: 'recommended'
  },
  {
    id: 'e18',
    sourceId: 'product-design',
    targetId: 'prototyping',
    type: 'recommended'
  },
  {
    id: 'e19',
    sourceId: 'prototyping',
    targetId: 'design-systems',
    type: 'required'
  }
];
