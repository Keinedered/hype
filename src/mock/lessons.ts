import { Lesson } from '../types/Lesson';

// Mock lessons согласно новой структуре: Трек → Курс → Модуль → Урок
export const lessons: Lesson[] = [
  // Курс "Основы ивент-менеджмента" (courseId: 1)
  // Модуль 1: Введение в event-индустрию (moduleId: 1)
  {
    id: 1,
    title: 'Рынок ивентов',
    description: 'Обзор рынка event-индустрии и его особенности',
    moduleId: 1,
    courseId: 1,
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1200,
    transcript: 'В этом уроке мы рассмотрим структуру рынка ивентов, основные игроки и тренды индустрии...',
    handbookExcerpts: [
      {
        id: 1,
        title: 'Основные понятия event-индустрии',
        text: 'Event-индустрия включает в себя организацию различных типов мероприятий: корпоративных, частных, публичных.',
        handbookSectionId: 1
      }
    ],
    assignmentId: 1
  },
  {
    id: 2,
    title: 'Роли в команде',
    description: 'Ключевые роли и ответственность в event-команде',
    moduleId: 1,
    courseId: 1,
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 900,
    transcript: 'Команда event-менеджера состоит из различных специалистов...',
    assignmentId: 2
  },
  // Модуль 2: Планирование мероприятия (moduleId: 2)
  {
    id: 3,
    title: 'Цели и задачи',
    description: 'Определение целей и постановка задач мероприятия',
    moduleId: 2,
    courseId: 1,
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1500,
    transcript: 'Правильная постановка целей - основа успешного мероприятия...',
    assignmentId: 3
  },
  {
    id: 4,
    title: 'Тайминг и бюджет',
    description: 'Планирование временных рамок и бюджета мероприятия',
    moduleId: 2,
    courseId: 1,
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1800,
    transcript: 'Эффективное планирование времени и бюджета требует системного подхода...',
    assignmentId: 4
  },
  // Модуль 3: Реализация и пост-анализ (moduleId: 3)
  {
    id: 5,
    title: 'Логистика мероприятия',
    description: 'Организация логистики и координация на площадке',
    moduleId: 3,
    courseId: 1,
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 2000,
    transcript: 'Логистика - один из ключевых аспектов успешного мероприятия...',
    assignmentId: 5
  },
  {
    id: 6,
    title: 'Оценка результатов',
    description: 'Методы оценки эффективности мероприятия',
    moduleId: 3,
    courseId: 1,
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1400,
    transcript: 'Анализ результатов помогает улучшить будущие мероприятия...',
    assignmentId: 6
  },
  // Курс "Введение в продуктовый менеджмент" (courseId: 3)
  // Модуль 4: Роль продукта (moduleId: 4)
  {
    id: 7,
    title: 'Что такое продукт',
    description: 'Определение продукта и его роль в бизнесе',
    moduleId: 4,
    courseId: 3,
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1600,
    transcript: 'Продукт - это решение проблемы пользователя...',
    assignmentId: 7
  },
  {
    id: 8,
    title: 'Роль продуктового менеджера',
    description: 'Обязанности и навыки продуктового менеджера',
    moduleId: 4,
    courseId: 3,
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1800,
    transcript: 'Продуктовый менеджер связывает бизнес, пользователей и разработку...',
    assignmentId: 8
  },
  // Модуль 5: Исследования (moduleId: 5)
  {
    id: 9,
    title: 'Исследование пользователей',
    description: 'Методы изучения потребностей пользователей',
    moduleId: 5,
    courseId: 3,
    order: 1,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 2000,
    transcript: 'Понимание пользователей - основа успешного продукта...',
    assignmentId: 9
  },
  {
    id: 10,
    title: 'Анализ рынка',
    description: 'Изучение конкурентов и рыночных трендов',
    moduleId: 5,
    courseId: 3,
    order: 2,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: 1700,
    transcript: 'Анализ рынка помогает найти возможности для продукта...',
    assignmentId: 10
  }
];
