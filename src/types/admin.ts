export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserDetail {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
  hashed_password: string;
  submissions_count: number;
  notifications_count: number;
  user_courses_count: number;
  user_lessons_count: number;
}

export interface ResetPasswordResponse {
  user_id: string;
  username: string;
  temporary_password: string;
}

export interface AdminCourseListItem {
  id: string;
  track_id: 'event' | 'digital' | 'communication' | 'design';
  title: string;
  version: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  module_count: number;
  lesson_count: number;
  task_count: number;
}

export interface AdminCourseDetail extends AdminCourseListItem {
  description: string;
  short_description: string;
  authors: string[];
  enrollment_deadline?: string | null;
  created_at?: string | null;
}

export interface AdminCourseCreate {
  id: string;
  track_id: AdminCourseDetail['track_id'];
  title: string;
  version: string;
  description: string;
  short_description: string;
  level: AdminCourseDetail['level'];
  task_count: number;
  enrollment_deadline?: string | null;
  authors: string[];
}

export interface AdminCourseUpdate {
  track_id?: AdminCourseDetail['track_id'];
  title?: string;
  version?: string;
  description?: string;
  short_description?: string;
  level?: AdminCourseDetail['level'];
  task_count?: number;
  enrollment_deadline?: string | null;
  authors?: string[];
}

export interface AdminModuleListItem {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  lesson_count: number;
}

export interface AdminModuleDetail {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
}

export interface AdminModuleCreate {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
}

export interface AdminModuleUpdate {
  course_id?: string;
  title?: string;
  description?: string;
  order_index?: number;
}

export interface AdminLessonListItem {
  id: string;
  module_id: string;
  title: string;
  description: string;
  order_index: number;
}

export interface AdminLessonDetail {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url?: string | null;
  video_duration?: string | null;
  content: string;
  order_index: number;
}

export interface AdminLessonCreate {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url?: string | null;
  video_duration?: string | null;
  content: string;
  order_index: number;
}

export interface AdminLessonUpdate {
  module_id?: string;
  title?: string;
  description?: string;
  video_url?: string | null;
  video_duration?: string | null;
  content?: string;
  order_index?: number;
}
