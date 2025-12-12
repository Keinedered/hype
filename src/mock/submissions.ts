import { Submission } from '../types/Assignment';

export const submissions: Submission[] = [
  {
    id: 1,
    assignmentId: 1,
    userId: 1,
    version: 1,
    textAnswer: 'Провел анализ рынка ивентов в Москве. Основные игроки:...',
    status: 'accepted',
    curatorComment: 'Отличная работа! Глубокий анализ с практическими выводами.',
    curatorId: 2,
    submittedAt: new Date('2024-01-15'),
    reviewedAt: new Date('2024-01-16')
  },
  {
    id: 2,
    assignmentId: 3,
    userId: 1,
    version: 1,
    textAnswer: 'Цели мероприятия: повышение узнаваемости бренда...',
    status: 'pending',
    submittedAt: new Date('2024-01-20')
  }
];
