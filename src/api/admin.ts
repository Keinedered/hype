import { axiosClient } from './axiosClient';
import {
  AdminCourseCreate,
  AdminCourseDetail,
  AdminCourseListItem,
  AdminCourseUpdate,
  AdminLessonCreate,
  AdminLessonDetail,
  AdminLessonListItem,
  AdminLessonUpdate,
  AdminModuleCreate,
  AdminModuleDetail,
  AdminModuleListItem,
  AdminModuleUpdate,
  AdminTrackCreate,
  AdminTrackDetail,
  AdminTrackUpdate,
  AdminUserDetail,
  AdminUserListItem,
  AdminSubmissionListItem,
  AdminSubmissionReview,
  ResetPasswordResponse,
} from '../types/admin';

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const response = await axiosClient.get<AdminUserListItem[]>('/admin/users');
  return response.data;
}

export async function getAdminUserDetails(userId: string): Promise<AdminUserDetail> {
  const response = await axiosClient.get<AdminUserDetail>(`/admin/users/${userId}`);
  return response.data;
}

export async function resetAdminUserPassword(userId: string): Promise<ResetPasswordResponse> {
  const response = await axiosClient.post<ResetPasswordResponse>(`/admin/users/${userId}/reset-password`);
  return response.data;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await axiosClient.delete(`/admin/users/${userId}`);
}

export async function getAdminCourses(): Promise<AdminCourseListItem[]> {
  const response = await axiosClient.get<AdminCourseListItem[]>('/admin/courses');
  return response.data;
}

export async function getAdminCourse(courseId: string): Promise<AdminCourseDetail> {
  const response = await axiosClient.get<AdminCourseDetail>(`/admin/courses/${courseId}`);
  return response.data;
}

export async function createAdminCourse(payload: AdminCourseCreate): Promise<AdminCourseDetail> {
  const response = await axiosClient.post<AdminCourseDetail>('/admin/courses', payload);
  return response.data;
}

export async function updateAdminCourse(courseId: string, payload: AdminCourseUpdate): Promise<AdminCourseDetail> {
  const response = await axiosClient.patch<AdminCourseDetail>(`/admin/courses/${courseId}`, payload);
  return response.data;
}

export async function deleteAdminCourse(courseId: string): Promise<void> {
  await axiosClient.delete(`/admin/courses/${courseId}`);
}

export async function getAdminModules(courseId: string): Promise<AdminModuleListItem[]> {
  const response = await axiosClient.get<AdminModuleListItem[]>(`/admin/courses/${courseId}/modules`);
  return response.data;
}

export async function getAdminModule(moduleId: string): Promise<AdminModuleDetail> {
  const response = await axiosClient.get<AdminModuleDetail>(`/admin/modules/${moduleId}`);
  return response.data;
}

export async function createAdminModule(payload: AdminModuleCreate): Promise<AdminModuleDetail> {
  const response = await axiosClient.post<AdminModuleDetail>('/admin/modules', payload);
  return response.data;
}

export async function updateAdminModule(moduleId: string, payload: AdminModuleUpdate): Promise<AdminModuleDetail> {
  const response = await axiosClient.patch<AdminModuleDetail>(`/admin/modules/${moduleId}`, payload);
  return response.data;
}

export async function deleteAdminModule(moduleId: string): Promise<void> {
  await axiosClient.delete(`/admin/modules/${moduleId}`);
}

export async function getAdminLessons(moduleId: string): Promise<AdminLessonListItem[]> {
  const response = await axiosClient.get<AdminLessonListItem[]>(`/admin/modules/${moduleId}/lessons`);
  return response.data;
}

export async function getAdminLesson(lessonId: string): Promise<AdminLessonDetail> {
  const response = await axiosClient.get<AdminLessonDetail>(`/admin/lessons/${lessonId}`);
  return response.data;
}

export async function createAdminLesson(payload: AdminLessonCreate): Promise<AdminLessonDetail> {
  const response = await axiosClient.post<AdminLessonDetail>('/admin/lessons', payload);
  return response.data;
}

export async function updateAdminLesson(lessonId: string, payload: AdminLessonUpdate): Promise<AdminLessonDetail> {
  const response = await axiosClient.patch<AdminLessonDetail>(`/admin/lessons/${lessonId}`, payload);
  return response.data;
}

export async function uploadAdminLessonVideo(lessonId: string, file: File): Promise<AdminLessonDetail> {
  const formData = new FormData();
  formData.append('video', file);

  const response = await axiosClient.post<AdminLessonDetail>(`/admin/lessons/${lessonId}/video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteAdminLessonVideo(lessonId: string): Promise<AdminLessonDetail> {
  const response = await axiosClient.delete<AdminLessonDetail>(`/admin/lessons/${lessonId}/video`);
  return response.data;
}

export async function deleteAdminLesson(lessonId: string): Promise<void> {
  await axiosClient.delete(`/admin/lessons/${lessonId}`);
}

export async function getAdminTracks(): Promise<AdminTrackDetail[]> {
  const response = await axiosClient.get<AdminTrackDetail[]>('/admin/tracks');
  return response.data;
}

export async function createAdminTrack(payload: AdminTrackCreate): Promise<AdminTrackDetail> {
  const response = await axiosClient.post<AdminTrackDetail>('/admin/tracks', payload);
  return response.data;
}

export async function updateAdminTrack(trackId: string, payload: AdminTrackUpdate): Promise<AdminTrackDetail> {
  const response = await axiosClient.patch<AdminTrackDetail>(`/admin/tracks/${trackId}`, payload);
  return response.data;
}

export async function deleteAdminTrack(trackId: string): Promise<void> {
  await axiosClient.delete(`/admin/tracks/${trackId}`);
}

export async function getAdminSubmissions(): Promise<AdminSubmissionListItem[]> {
  const response = await axiosClient.get<AdminSubmissionListItem[]>('/admin/submissions');
  return response.data;
}

export async function reviewAdminSubmission(
  submissionId: string,
  payload: AdminSubmissionReview
): Promise<void> {
  await axiosClient.post(`/admin/submissions/${submissionId}/review`, payload);
}
