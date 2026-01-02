import { Track, Course, Module, Lesson, GraphNode, GraphEdge } from '../types';

export const tracks: Track[] = [
  {
    id: 'event',
    name: 'Ивент',
    description: 'Организация мероприятий и управление событиями',
    color: '#D4A5B8' // Улучшена контрастность для черного текста
  },
  {
    id: 'digital',
    name: 'Цифровые продукты',
    description: 'Product management и продуктовая аналитика',
    color: '#A8D4B8' // Улучшена контрастность для черного текста
  },
  {
    id: 'communication',
    name: 'Внешние коммуникации',
    description: 'Деловая коммуникация и внешние связи',
    color: '#A8B8D4' // Улучшена контрастность для черного текста
  },
  {
    id: 'design',
    name: 'Дизайн',
    description: 'Графический и продуктовый дизайн',
    color: '#B8A5D4' // Улучшена контрастность для черного текста
  }
];

export const courses: Course[] = [
  {
    id: 'design',
    trackId: 'design',
    title: 'Дизайн',
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
    id: 'event-basics',
    trackId: 'event',
    title: 'Ивент',
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
    id: 'product-intro',
    trackId: 'digital',
    title: 'Цифровые продукты',
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
    id: 'business-comm',
    trackId: 'communication',
    title: 'Внешние коммуникации',
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
  // ЦЕНТРАЛЬНЫЙ УЗЕЛ
  {
    id: 'root',
    type: 'concept',
    entityId: 'root',
    title: 'GRAPH',
    x: 800,
    y: 500,
    status: 'completed',
    size: 80
  },

  // ПЕРВЫЙ КРУГ - основные курсы каждого трека (радиус ~350px от центра, с учетом текста)
  // DESIGN - верх-лево (315°)
  {
    id: 'design',
    type: 'course',
    entityId: 'design',
    title: 'Дизайн',
    x: 550,
    y: 300,
    status: 'completed',
    size: 45
  },
  // EVENT - верх-право (45°)
  {
    id: 'event-basics',
    type: 'course',
    entityId: 'event-basics',
    title: 'Ивент',
    x: 1050,
    y: 300,
    status: 'current',
    size: 45
  },
  // DIGITAL - низ-лево (225°)
  {
    id: 'product-intro',
    type: 'course',
    entityId: 'product-intro',
    title: 'Цифровые\nпродукты',
    x: 550,
    y: 700,
    status: 'open',
    size: 45
  },
  // COMMUNICATION - низ-право (135°)
  {
    id: 'business-comm',
    type: 'course',
    entityId: 'business-comm',
    title: 'Внешние\nкоммуникации',
    x: 1050,
    y: 700,
    status: 'open',
    size: 45
  },

  // ВТОРОЙ КРУГ EVENT - радиус ~550px (больше для размещения текста)
  {
    id: 'event-offline',
    type: 'course',
    entityId: 'event-offline',
    title: 'Офлайн\nМероприятия',
    x: 350,
    y: 150,
    status: 'open',
    size: 40
  },
  {
    id: 'event-online',
    type: 'course',
    entityId: 'event-online',
    title: 'Онлайн\nМероприятия',
    x: 600,
    y: 120,
    status: 'open',
    size: 40
  },

  // ВТОРОЙ КРУГ DIGITAL - радиус ~550px
  {
    id: 'user-research',
    type: 'course',
    entityId: 'user-research',
    title: 'Исследования\nПользователей',
    x: 1250,
    y: 120,
    status: 'open',
    size: 40
  },
  {
    id: 'cjm-course',
    type: 'course',
    entityId: 'cjm-course',
    title: 'CJM',
    x: 1000,
    y: 150,
    status: 'closed',
    size: 38
  },
  {
    id: 'product-metrics',
    type: 'course',
    entityId: 'product-metrics',
    title: 'Метрики\nПродукта',
    x: 1250,
    y: 300,
    status: 'open',
    size: 40
  },

  // ВТОРОЙ КРУГ COMMUNICATION - радиус ~550px
  {
    id: 'presentation-skills',
    type: 'course',
    entityId: 'presentation-skills',
    title: 'Навыки\nПрезентации',
    x: 350,
    y: 850,
    status: 'open',
    size: 40
  },
  {
    id: 'external-comm',
    type: 'course',
    entityId: 'external-comm',
    title: 'Внешние\nКоммуникации',
    x: 600,
    y: 880,
    status: 'completed',
    size: 40
  },

  // ВТОРОЙ КРУГ DESIGN - радиус ~550px
  {
    id: 'ui-fundamentals',
    type: 'course',
    entityId: 'ui-fundamentals',
    title: 'Основы\nUI Дизайна',
    x: 1000,
    y: 850,
    status: 'open',
    size: 40
  },
  {
    id: 'product-design',
    type: 'course',
    entityId: 'product-design',
    title: 'Продуктовый\nДизайн',
    x: 1250,
    y: 700,
    status: 'current',
    size: 45
  },

  // ТРЕТИЙ КРУГ - финальные курсы (радиус ~750px, увеличен для текста)
  {
    id: 'event-budget',
    type: 'course',
    entityId: 'event-budget',
    title: 'Бюджет\nИвентов',
    x: 250,
    y: 80,
    status: 'closed',
    size: 38
  },
  {
    id: 'product-launch',
    type: 'course',
    entityId: 'product-launch',
    title: 'Запуск\nПродукта',
    x: 1350,
    y: 150,
    status: 'closed',
    size: 38
  },
  {
    id: 'crisis-comm',
    type: 'course',
    entityId: 'crisis-comm',
    title: 'Кризисные\nКоммуникации',
    x: 250,
    y: 920,
    status: 'closed',
    size: 38
  },
  {
    id: 'media-relations',
    type: 'course',
    entityId: 'media-relations',
    title: 'Работа\nсо СМИ',
    x: 500,
    y: 950,
    status: 'open',
    size: 38
  },
  {
    id: 'prototyping',
    type: 'course',
    entityId: 'prototyping',
    title: 'Прототипы',
    x: 1250,
    y: 880,
    status: 'open',
    size: 38
  },
  {
    id: 'design-systems',
    type: 'course',
    entityId: 'design-systems',
    title: 'Дизайн\nСистемы',
    x: 1350,
    y: 850,
    status: 'closed',
    size: 38
  }
];

export const graphEdges: GraphEdge[] = [
  // От центра к началу каждого созвездия
  {
    id: 'center-1',
    sourceId: 'root',
    targetId: 'design',
    type: 'required'
  },
  {
    id: 'center-2',
    sourceId: 'root',
    targetId: 'event-basics',
    type: 'required'
  },
  {
    id: 'center-3',
    sourceId: 'root',
    targetId: 'product-intro',
    type: 'required'
  },
  {
    id: 'center-4',
    sourceId: 'root',
    targetId: 'business-comm',
    type: 'required'
  },

  // EVENT CONSTELLATION - созвездие ивентов
  {
    id: 'e1',
    sourceId: 'event-basics',
    targetId: 'event-offline',
    type: 'required'
  },
  {
    id: 'e2',
    sourceId: 'event-basics',
    targetId: 'event-online',
    type: 'required'
  },
  {
    id: 'e3',
    sourceId: 'event-offline',
    targetId: 'event-budget',
    type: 'required'
  },
  {
    id: 'e4',
    sourceId: 'event-online',
    targetId: 'event-budget',
    type: 'required'
  },
  {
    id: 'e5',
    sourceId: 'event-offline',
    targetId: 'event-online',
    type: 'recommended'
  },

  // DIGITAL CONSTELLATION - созвездие цифровых продуктов
  {
    id: 'd1',
    sourceId: 'product-intro',
    targetId: 'user-research',
    type: 'required'
  },
  {
    id: 'd2',
    sourceId: 'product-intro',
    targetId: 'cjm-course',
    type: 'required'
  },
  {
    id: 'd3',
    sourceId: 'product-intro',
    targetId: 'product-metrics',
    type: 'required'
  },
  {
    id: 'd4',
    sourceId: 'user-research',
    targetId: 'product-launch',
    type: 'required'
  },
  {
    id: 'd5',
    sourceId: 'cjm-course',
    targetId: 'product-metrics',
    type: 'recommended'
  },
  {
    id: 'd6',
    sourceId: 'product-metrics',
    targetId: 'product-launch',
    type: 'required'
  },

  // COMMUNICATION CONSTELLATION - созвездие коммуникаций
  {
    id: 'c1',
    sourceId: 'business-comm',
    targetId: 'presentation-skills',
    type: 'required'
  },
  {
    id: 'c2',
    sourceId: 'business-comm',
    targetId: 'external-comm',
    type: 'required'
  },
  {
    id: 'c3',
    sourceId: 'external-comm',
    targetId: 'media-relations',
    type: 'required'
  },
  {
    id: 'c4',
    sourceId: 'presentation-skills',
    targetId: 'media-relations',
    type: 'recommended'
  },
  {
    id: 'c5',
    sourceId: 'media-relations',
    targetId: 'crisis-comm',
    type: 'required'
  },
  {
    id: 'c6',
    sourceId: 'external-comm',
    targetId: 'crisis-comm',
    type: 'recommended'
  },

  // DESIGN CONSTELLATION - созвездие дизайна
  {
    id: 'des1',
    sourceId: 'design',
    targetId: 'ui-fundamentals',
    type: 'required'
  },
  {
    id: 'des2',
    sourceId: 'design',
    targetId: 'product-design',
    type: 'required'
  },
  {
    id: 'des3',
    sourceId: 'product-design',
    targetId: 'prototyping',
    type: 'required'
  },
  {
    id: 'des4',
    sourceId: 'ui-fundamentals',
    targetId: 'product-design',
    type: 'recommended'
  },
  {
    id: 'des5',
    sourceId: 'prototyping',
    targetId: 'design-systems',
    type: 'required'
  },
  {
    id: 'des6',
    sourceId: 'product-design',
    targetId: 'design-systems',
    type: 'recommended'
  }
];
