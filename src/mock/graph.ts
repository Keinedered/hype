import { GraphNode, GraphEdge } from '../types/Graph';

// Вершины графа для курса "Основы ивент-менеджмента" (courseId: 1)
export const graphNodes: GraphNode[] = [
  // Уроки курса 1
  {
    id: 1,
    type: 'lesson',
    entityId: 1, // lessonId: 1
    title: 'Рынок ивентов',
    description: 'Обзор рынка event-индустрии',
    status: 'completed',
    x: 200,
    y: 300,
    size: 1,
    color: '#FF6B35'
  },
  {
    id: 2,
    type: 'lesson',
    entityId: 2,
    title: 'Роли в команде',
    description: 'Ключевые роли в event-команде',
    status: 'completed',
    x: 400,
    y: 300,
    size: 1,
    color: '#FF6B35'
  },
  {
    id: 3,
    type: 'lesson',
    entityId: 3,
    title: 'Цели и задачи',
    description: 'Определение целей мероприятия',
    status: 'in-progress',
    x: 300,
    y: 500,
    size: 1.2,
    color: '#FF6B35'
  },
  {
    id: 4,
    type: 'lesson',
    entityId: 4,
    title: 'Тайминг и бюджет',
    description: 'Планирование времени и бюджета',
    status: 'not-started',
    x: 500,
    y: 500,
    size: 1,
    color: '#FF6B35'
  },
  {
    id: 5,
    type: 'lesson',
    entityId: 5,
    title: 'Логистика мероприятия',
    description: 'Организация логистики',
    status: 'locked',
    x: 400,
    y: 700,
    size: 1,
    color: '#9CA3AF'
  },
  {
    id: 6,
    type: 'lesson',
    entityId: 6,
    title: 'Оценка результатов',
    description: 'Методы оценки эффективности',
    status: 'locked',
    x: 600,
    y: 700,
    size: 1,
    color: '#9CA3AF'
  }
];

export const graphEdges: GraphEdge[] = [
  {
    id: 1,
    sourceNodeId: 1,
    targetNodeId: 2,
    type: 'recommended'
  },
  {
    id: 2,
    sourceNodeId: 1,
    targetNodeId: 3,
    type: 'required'
  },
  {
    id: 3,
    sourceNodeId: 2,
    targetNodeId: 3,
    type: 'recommended'
  },
  {
    id: 4,
    sourceNodeId: 3,
    targetNodeId: 4,
    type: 'required'
  },
  {
    id: 5,
    sourceNodeId: 3,
    targetNodeId: 5,
    type: 'required'
  },
  {
    id: 6,
    sourceNodeId: 4,
    targetNodeId: 5,
    type: 'recommended'
  },
  {
    id: 7,
    sourceNodeId: 5,
    targetNodeId: 6,
    type: 'required'
  }
];
