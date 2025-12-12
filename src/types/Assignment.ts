export type SubmissionStatus = 'not-submitted' | 'pending' | 'accepted' | 'needs-revision';

export interface Assignment {
  id: number;
  lessonId: number;
  title: string;
  description: string; // Формулировка задания
  criteria?: string; // Критерии оценки
  acceptsText: boolean; // Принимает текстовый ответ
  acceptsFile: boolean; // Принимает файлы
  acceptsLink: boolean; // Принимает ссылку
  allowedFileTypes?: string[]; // Разрешенные типы файлов (pdf, docx, pptx, images)
}

export interface Submission {
  id: number;
  assignmentId: number;
  userId: number;
  version: number; // Номер версии (если несколько попыток)
  textAnswer?: string; // Текстовый ответ
  fileUrls?: string[]; // URL загруженных файлов
  linkUrl?: string; // Ссылка на решение
  status: SubmissionStatus;
  curatorComment?: string; // Комментарий куратора
  curatorId?: number; // ID куратора, проверившего задание
  submittedAt: Date; // Дата отправки
  reviewedAt?: Date; // Дата проверки
}