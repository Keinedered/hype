export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'course_editor';
  createdAt: string;
  updatedAt: string;
  courseCreationAllowed: boolean;
}

export interface ApiErrorResponse {
  message?: string;
  detail?: string;
}
