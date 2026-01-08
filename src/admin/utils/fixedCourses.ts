// 4 фиксированных курса платформы
// Структура: 4 курса → модули (образуют граф) → уроки
export const FIXED_COURSES = [
  { id: 'design', title: 'Дизайн', track: 'design' },
  { id: 'event-basics', title: 'Ивент', track: 'event' },
  { id: 'product-intro', title: 'Цифровые продукты', track: 'digital' },
  { id: 'business-comm', title: 'Внешние коммуникации', track: 'communication' },
] as const;

export const FIXED_COURSE_IDS = FIXED_COURSES.map(c => c.id);

// Функция для фильтрации курсов - возвращает только фиксированные
export function filterFixedCourses<T extends { id: string }>(courses: T[]): T[] {
  return courses.filter(course => FIXED_COURSE_IDS.includes(course.id));
}

// Функция для проверки, является ли курс фиксированным
export function isFixedCourse(courseId: string): boolean {
  return FIXED_COURSE_IDS.includes(courseId);
}

