export type NodeType = 'track' | 'course' | 'module' | 'lesson' | 'concept';
export type NodeStatus = 'not-started' | 'in-progress' | 'completed' | 'locked';
export type EdgeType = 'required' | 'alternative' | 'recommended';

export interface GraphNode {
  id: number;
  type: NodeType;
  entityId: number; // ID связанной сущности (курса, урока и т.д.)
  title: string;
  description?: string;
  status: NodeStatus; // Статус для текущего пользователя
  x?: number; // Координата X на карте (для визуализации)
  y?: number; // Координата Y на карте
  size?: number; // Размер вершины (отражает важность)
  color?: string; // Цвет вершины
}

export interface GraphEdge {
  id: number;
  sourceNodeId: number; // ID вершины-источника
  targetNodeId: number; // ID вершины-приёмника
  type: EdgeType; // Тип связи
  condition?: string; // Условие перехода (опционально)
}