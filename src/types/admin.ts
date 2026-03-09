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
