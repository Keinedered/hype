export type LessonStatus = 'not-started' | 'in-progress' | 'completed' | 'locked';

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  moduleId: number; // ID модуля
  courseId: number; // ID курса (для удобства)
  order: number; // Порядок урока в модуле
  videoUrl?: string; // URL к видео (файл или видеохостинг)
  videoDuration?: number; // Длительность видео в секундах
  transcript?: string; // Текстовый конспект/расшифровка
  handbookExcerpts?: HandbookExcerpt[]; // Выдержки из хендбука
  assignmentId?: number; // ID задания
}

export interface HandbookExcerpt {
  id: number;
  title: string;
  text: string; // Краткий фрагмент (2-3 предложения)
  handbookSectionId: number; // ID раздела хендбука для глубокой ссылки
}
