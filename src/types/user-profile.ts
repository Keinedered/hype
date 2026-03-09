export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  message?: string;
  detail?: string;
}
