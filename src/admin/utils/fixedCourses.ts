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
  console.log('[filterFixedCourses] Input courses:', courses);
  console.log('[filterFixedCourses] Fixed course IDs:', FIXED_COURSE_IDS);
  const filtered = courses.filter(course => {
    const isFixed = FIXED_COURSE_IDS.includes(course.id);
    if (!isFixed) {
      console.log(`[filterFixedCourses] Course ${course.id} (${course.title}) is not in fixed courses list`);
    }
    return isFixed;
  });
  console.log('[filterFixedCourses] Filtered courses:', filtered);
  return filtered;
}

// Функция для проверки, является ли курс фиксированным
export function isFixedCourse(courseId: string): boolean {
  return FIXED_COURSE_IDS.includes(courseId);
}

