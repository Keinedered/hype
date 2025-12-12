import { Module } from '../types/Module';

export const modules: Module[] = [
  // Курс "Основы ивент-менеджмента" (courseId: 1)
  {
    id: 1,
    title: 'Введение в event-индустрию',
    description: 'Знакомство с рынком ивентов и ролями в команде',
    courseId: 1,
    order: 1
  },
  {
    id: 2,
    title: 'Планирование мероприятия',
    description: 'Цели, задачи, тайминг и бюджет',
    courseId: 1,
    order: 2
  },
  {
    id: 3,
    title: 'Реализация и пост-анализ',
    description: 'Логистика, работа с подрядчиками, оценка результатов',
    courseId: 1,
    order: 3
  },
  // Курс "Введение в продуктовый менеджмент" (courseId: 3)
  {
    id: 4,
    title: 'Роль продукта',
    description: 'Понимание роли продукта в бизнесе',
    courseId: 3,
    order: 1
  },
  {
    id: 5,
    title: 'Исследования',
    description: 'Методы исследования пользователей и рынка',
    courseId: 3,
    order: 2
  },
  {
    id: 6,
    title: 'Постановка задач и метрик',
    description: 'Определение целей и метрик успеха продукта',
    courseId: 3,
    order: 3
  },
  {
    id: 7,
    title: 'Запуск и оценка',
    description: 'Процесс запуска продукта и оценка результатов',
    courseId: 3,
    order: 4
  }
];
