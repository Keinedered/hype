// Централизованные функции преобразования данных из API
import { Course, Module, Lesson, TrackId } from '../types';

// Типы для API ответов
export interface ApiCourse {
  id: string;
  track_id: string;
  title: string;
  version?: string;
  description?: string;
  short_description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  module_count?: number;
  lesson_count?: number;
  task_count?: number;
  authors?: string[];
  enrollment_deadline?: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface ApiModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  lessons?: ApiLesson[];
  progress?: number;
}

export interface ApiLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: number;
  content?: string;
  handbook_excerpts?: unknown[];
  assignment?: unknown;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface ApiTrack {
  id: string;
  name: string;
  description?: string;
  color: string;
}

/**
 * Преобразует данные курса из API в формат фронтенда
 */
export function transformCourseFromAPI(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    trackId: apiCourse.track_id as TrackId,
    title: apiCourse.title,
    version: apiCourse.version || '1.0',
    description: apiCourse.description || '',
    shortDescription: apiCourse.short_description || '',
    level: apiCourse.level,
    moduleCount: apiCourse.module_count || 0,
    lessonCount: apiCourse.lesson_count || 0,
    taskCount: apiCourse.task_count || 0,
    authors: apiCourse.authors || [],
    enrollmentDeadline: apiCourse.enrollment_deadline,
    progress: apiCourse.progress,
    status: apiCourse.status,
  };
}

/**
 * Преобразует данные модуля из API в формат фронтенда
 */
export function transformModuleFromAPI(apiModule: ApiModule): Module {
  return {
    id: apiModule.id,
    courseId: apiModule.course_id,
    title: apiModule.title,
    description: apiModule.description || '',
    lessons: apiModule.lessons ? apiModule.lessons.map(transformLessonFromAPI) : [],
    progress: apiModule.progress,
  };
}

/**
 * Преобразует данные урока из API в формат фронтенда
 */
export function transformLessonFromAPI(apiLesson: ApiLesson): Lesson {
  return {
    id: apiLesson.id,
    moduleId: apiLesson.module_id,
    title: apiLesson.title,
    description: apiLesson.description || '',
    videoUrl: apiLesson.video_url,
    videoDuration: apiLesson.video_duration,
    content: apiLesson.content || '',
    handbookExcerpts: apiLesson.handbook_excerpts || [],
    assignment: apiLesson.assignment || null,
    status: apiLesson.status,
  };
}

