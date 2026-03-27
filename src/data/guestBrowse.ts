import { courses, graphEdges, graphNodes, modules as modulesSeed, tracks } from './mockData';
import type { Course, GraphEdge, GraphNode, Lesson, Module, Track } from '../types';

const GUEST_LESSON_TAG = '-guest-demo';

function demoLesson(moduleId: string, moduleTitle: string, orderIndex: number): Lesson {
  return {
    id: `${moduleId}${GUEST_LESSON_TAG}`,
    moduleId,
    title: `${moduleTitle}: обзор`,
    description: 'Демонстрационный урок. Войдите в аккаунт, чтобы открыть полные материалы и задания.',
    content:
      '# Демо-режим\n\nЗдесь показан пример урока. После входа доступны видео, задания и проверка куратором.',
    orderIndex,
    handbookExcerpts: [],
    status: 'not_started',
  };
}

/** Модули курса с минимум одним демо-уроком на модуль (для навигации без API). */
export function getGuestModulesForCourse(courseId: string): Module[] | null {
  const list = modulesSeed.filter((m) => m.courseId === courseId);
  if (list.length === 0) {
    return null;
  }
  return [...list]
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((m, idx) => {
      const order = m.orderIndex ?? idx + 1;
      const withLessons =
        m.lessons && m.lessons.length > 0
          ? m.lessons
          : [demoLesson(m.id, m.title, 1)];
      return {
        ...m,
        orderIndex: order,
        lessons: withLessons.map((l, i) => ({
          ...l,
          orderIndex: l.orderIndex ?? i + 1,
        })),
      };
    });
}

export function getGuestCourseAndTrack(courseId: string): { course: Course; track: Track } | null {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const track = tracks.find((t) => t.id === course.trackId);
  if (!track) return null;
  return { course, track };
}

export type GuestLessonBundle = {
  lesson: Lesson;
  module: Module;
  course: Course;
  track: Track;
  moduleLessons: Lesson[];
};

export function getGuestLessonBundle(lessonId: string): GuestLessonBundle | null {
  for (const course of courses) {
    const mods = getGuestModulesForCourse(course.id);
    if (!mods) continue;
    for (const mod of mods) {
      const lesson = mod.lessons?.find((l) => l.id === lessonId);
      if (!lesson) continue;
      const track = tracks.find((t) => t.id === course.trackId);
      if (!track) continue;
      const moduleLessons = [...(mod.lessons ?? [])].sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      );
      return {
        lesson,
        module: mod,
        course,
        track,
        moduleLessons,
      };
    }
  }
  return null;
}

export function getGuestGraphPayload(): {
  courses: Course[];
  tracks: Track[];
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  return {
    courses: [...courses],
    tracks: [...tracks],
    nodes: [...graphNodes],
    edges: [...graphEdges],
  };
}

export function getGuestHandbookCourse(courseId: string): { course: Course; track: Track } | null {
  return getGuestCourseAndTrack(courseId);
}
