export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'course_editor';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserDetail {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'course_editor';
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
  hashed_password: string;
  submissions_count: number;
  notifications_count: number;
  user_courses_count: number;
  user_lessons_count: number;
  editable_course_ids: string[];
  course_creation_allowed: boolean;
}

export interface AdminUserUpdate {
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  role?: 'user' | 'admin' | 'course_editor';
  is_active?: boolean;
  editable_course_ids?: string[];
  course_creation_allowed?: boolean;
}

export interface ResetPasswordResponse {
  user_id: string;
  username: string;
  temporary_password: string;
}

export interface AdminSubmissionListItem {
  id: string;
  assignment_id: string;
  user_id: string;
  username: string;
  lesson_id: string;
  version: number;
  text_answer?: string | null;
  link_url?: string | null;
  file_urls?: string[];
  status: 'not_submitted' | 'pending' | 'accepted' | 'needs_revision';
  curator_comment?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

export interface AdminSubmissionReview {
  status: 'pending' | 'accepted' | 'needs_revision';
  curator_comment?: string | null;
}

export interface AdminTrackDetail {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}

export interface AdminTrackCreate {
  id: AdminTrackDetail['id'];
  name: string;
  description?: string | null;
  color: string;
}

export interface AdminTrackUpdate {
  name?: string | null;
  description?: string | null;
  color?: string;
}

export interface AdminCourseListItem {
  id: string;
  track_id: 'event' | 'digital' | 'communication' | 'design';
  title: string;
  version?: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  module_count: number;
  lesson_count: number;
  task_count: number;
}

export interface AdminCourseDetail extends AdminCourseListItem {
  description?: string | null;
  short_description?: string | null;
  authors: string[];
  enrollment_deadline?: string | null;
  created_at?: string | null;
}

export interface AdminCourseCreate {
  id: string;
  track_id: AdminCourseDetail['track_id'];
  title: string;
  version?: string | null;
  description?: string | null;
  short_description?: string | null;
  level: AdminCourseDetail['level'];
  task_count: number;
  enrollment_deadline?: string | null;
  authors: string[];
}

export interface AdminCourseUpdate {
  track_id?: AdminCourseDetail['track_id'];
  title?: string | null;
  version?: string | null;
  description?: string | null;
  short_description?: string | null;
  level?: AdminCourseDetail['level'];
  task_count?: number;
  enrollment_deadline?: string | null;
  authors?: string[];
}

export interface AdminModuleListItem {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
  lesson_count: number;
}

export interface AdminModuleDetail {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}

export interface AdminModuleCreate {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}

export interface AdminModuleUpdate {
  course_id?: string;
  title?: string | null;
  description?: string | null;
  order_index?: number;
}

export interface AdminLessonListItem {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}

export interface AdminAssignmentDetail {
  id: string;
  lesson_id: string;
  description: string;
  criteria: string;
  requires_text: boolean;
  requires_file: boolean;
  requires_link: boolean;
  requires_any: boolean;
}

export interface AdminAssignmentCreate {
  id?: string | null;
  description?: string | null;
  criteria?: string | null;
  requires_text: boolean;
  requires_file: boolean;
  requires_link: boolean;
  requires_any: boolean;
}

export interface AdminAssignmentUpdate {
  id?: string | null;
  description?: string | null;
  criteria?: string | null;
  requires_text?: boolean | null;
  requires_file?: boolean | null;
  requires_link?: boolean | null;
  requires_any?: boolean | null;
}

export interface AdminLessonDetail {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  video_duration?: string | null;
  content?: string | null;
  order_index: number;
  assignment?: AdminAssignmentDetail | null;
}

export interface AdminLessonCreate {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  video_duration?: string | null;
  content?: string | null;
  order_index: number;
  assignment?: AdminAssignmentCreate | null;
}

export interface AdminLessonUpdate {
  module_id?: string;
  title?: string | null;
  description?: string | null;
  video_url?: string | null;
  video_duration?: string | null;
  content?: string | null;
  order_index?: number;
  assignment?: AdminAssignmentUpdate | null;
}
