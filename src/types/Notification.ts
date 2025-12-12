export type NotificationType = 
  | 'curator-comment'
  | 'submission-status-changed'
  | 'new-branch-opened'
  | 'reminder-unfinished-lesson';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityId?: number; // ID связанной сущности (урока, задания и т.д.)
  relatedEntityType?: string; // Тип сущности
}