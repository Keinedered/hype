import { Assignment, Course, HandbookExcerpt, Lesson, Module, Track } from '../types';

export type RawTrack = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type RawCourse = {
  id: string;
  track_id: string;
  title: string;
  version: string;
  description: string;
  short_description: string;
  level: Course['level'];
  module_count: number;
  lesson_count: number;
  task_count: number;
  authors: string[];
  enrollment_deadline?: string | null;
  progress?: number | null;
  status?: Course['status'] | null;
};

export type RawHandbookExcerpt = {
  id: string;
  lesson_id: string;
  section_title: string;
  excerpt: string;
  full_section_id: string;
};

export type RawAssignment = {
  id: string;
  lesson_id: string;
  description: string;
  criteria: string;
  requires_text: boolean;
  requires_file: boolean;
  requires_link: boolean;
};

export type RawLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url?: string | null;
  video_duration?: string | null;
  content: string;
  order_index?: number | null;
  handbook_excerpts?: RawHandbookExcerpt[] | null;
  assignment?: RawAssignment | null;
  status?: Lesson['status'] | null;
};

export type RawModule = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index?: number | null;
  progress?: number | null;
  lessons?: RawLesson[] | null;
};

export type RawGraphNode = {
  id: string;
  type: string;
  entity_id: string;
  title: string;
  x: number;
  y: number;
  status?: string | null;
  size?: number | null;
};

export type RawGraphEdge = {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
};

export const normalizeTrack = (raw: RawTrack): Track => ({
  id: raw.id as Track['id'],
  name: raw.name,
  description: raw.description,
  color: raw.color,
});

export const normalizeCourse = (raw: RawCourse): Course => ({
  id: raw.id,
  trackId: raw.track_id as Course['trackId'],
  title: raw.title,
  version: raw.version,
  description: raw.description,
  shortDescription: raw.short_description,
  level: raw.level,
  moduleCount: raw.module_count,
  lessonCount: raw.lesson_count,
  taskCount: raw.task_count,
  authors: raw.authors ?? [],
  enrollmentDeadline: raw.enrollment_deadline ?? undefined,
  progress: raw.progress ?? undefined,
  status: raw.status ?? undefined,
});

export const normalizeHandbookExcerpt = (raw: RawHandbookExcerpt): HandbookExcerpt => ({
  id: raw.id,
  sectionTitle: raw.section_title,
  excerpt: raw.excerpt,
  fullSectionId: raw.full_section_id,
});

export const normalizeAssignment = (raw: RawAssignment): Assignment => ({
  id: raw.id,
  lessonId: raw.lesson_id,
  description: raw.description,
  criteria: raw.criteria,
  requiresText: raw.requires_text,
  requiresFile: raw.requires_file,
  requiresLink: raw.requires_link,
});

export const normalizeLesson = (raw: RawLesson): Lesson => ({
  id: raw.id,
  moduleId: raw.module_id,
  title: raw.title,
  description: raw.description,
  videoUrl: raw.video_url ?? undefined,
  videoDuration: raw.video_duration ?? undefined,
  content: raw.content,
  orderIndex: raw.order_index ?? undefined,
  handbookExcerpts: (raw.handbook_excerpts ?? []).map(normalizeHandbookExcerpt),
  assignment: raw.assignment ? normalizeAssignment(raw.assignment) : undefined,
  status: raw.status ?? undefined,
});

export const normalizeModule = (raw: RawModule): Module => ({
  id: raw.id,
  courseId: raw.course_id,
  title: raw.title,
  description: raw.description,
  orderIndex: raw.order_index ?? undefined,
  progress: raw.progress ?? undefined,
  lessons: (raw.lessons ?? []).map(normalizeLesson),
});

export const normalizeGraphNode = (raw: RawGraphNode) => ({
  id: raw.id,
  type: raw.type as any,
  entityId: raw.entity_id,
  title: raw.title,
  x: raw.x,
  y: raw.y,
  status: raw.status ?? undefined,
  size: raw.size ?? undefined,
});

export const normalizeGraphEdge = (raw: RawGraphEdge) => ({
  id: raw.id,
  sourceId: raw.source_id,
  targetId: raw.target_id,
  type: raw.type as any,
});
