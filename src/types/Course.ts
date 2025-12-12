export interface Course {
  id: number;
  title: string;
  description: string;
  extendedDescription?: string; // Расширенное описание
  trackId: number; // ID трека
  version: string; // Версия курса (v1.0, v1.1)
  level: 'beginner' | 'intermediate' | 'advanced'; // Уровень сложности
  goals?: string[]; // Цели обучения
  targetAudience?: string; // Для кого курс
  results?: string[]; // Результаты после прохождения
  authors?: string[]; // Авторы курса
  moduleCount?: number; // Количество модулей
  lessonCount?: number; // Количество уроков
}