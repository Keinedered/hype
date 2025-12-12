import { Course } from '../types/Course';

export const courses: Course[] = [
  // Трек "Ивент" (trackId: 1)
  {
    id: 1,
    title: 'Основы ивент-менеджмента',
    description: 'Изучите основы организации и проведения мероприятий',
    extendedDescription: 'Курс познакомит вас с основами ивент-индустрии, планированием мероприятий и работой с командой.',
    trackId: 1,
    version: 'v1.0',
    level: 'beginner',
    goals: [
      'Понять структуру ивент-индустрии',
      'Научиться планировать мероприятия',
      'Освоить работу с подрядчиками'
    ],
    targetAudience: 'Начинающие специалисты в event-индустрии',
    results: [
      'Сможете планировать мероприятия',
      'Научитесь работать с бюджетом',
      'Освоите базовые инструменты event-менеджмента'
    ],
    authors: ['Анна Смирнова', 'Дмитрий Петров'],
    moduleCount: 3,
    lessonCount: 6
  },
  {
    id: 2,
    title: 'Организация офлайн-мероприятий',
    description: 'Практические навыки организации офлайн-событий',
    trackId: 1,
    version: 'v1.0',
    level: 'intermediate',
    moduleCount: 4,
    lessonCount: 8
  },
  // Трек "Цифровые продукты" (trackId: 2)
  {
    id: 3,
    title: 'Введение в продуктовый менеджмент',
    description: 'Основы управления цифровыми продуктами',
    trackId: 2,
    version: 'v1.0',
    level: 'beginner',
    moduleCount: 4,
    lessonCount: 10
  },
  {
    id: 4,
    title: 'Карта пользовательского пути и CJM',
    description: 'Создание и анализ карт пользовательского опыта',
    trackId: 2,
    version: 'v1.0',
    level: 'intermediate',
    moduleCount: 3,
    lessonCount: 7
  },
  // Трек "Внешка и деловая коммуникация" (trackId: 3)
  {
    id: 5,
    title: 'Основы деловой переписки',
    description: 'Эффективная деловая коммуникация в письменной форме',
    trackId: 3,
    version: 'v1.0',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 6
  },
  {
    id: 6,
    title: 'Внешние коммуникации компании',
    description: 'Управление внешними коммуникациями и репутацией',
    trackId: 3,
    version: 'v1.0',
    level: 'intermediate',
    moduleCount: 4,
    lessonCount: 8
  },
  // Трек "Дизайн" (trackId: 4)
  {
    id: 7,
    title: 'Основы графического дизайна',
    description: 'Базовые принципы и инструменты графического дизайна',
    trackId: 4,
    version: 'v1.0',
    level: 'beginner',
    moduleCount: 3,
    lessonCount: 9
  },
  {
    id: 8,
    title: 'Продуктовый дизайн и интерфейсы',
    description: 'Создание пользовательских интерфейсов и продуктовый дизайн',
    trackId: 4,
    version: 'v1.0',
    level: 'intermediate',
    moduleCount: 4,
    lessonCount: 12
  }
];