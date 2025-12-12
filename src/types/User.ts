export type UserRole = 'student' | 'curator' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}