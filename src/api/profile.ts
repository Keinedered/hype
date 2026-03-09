import { axiosClient } from './axiosClient';
import { UserProfile } from '../types/user-profile';

interface RawUserProfile {
  id?: string | number;
  username?: string;
  email?: string;
  fullName?: string | null;
  full_name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  role?: 'user' | 'admin';
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface UpdateUserProfilePayload {
  email?: string;
  username?: string;
  full_name?: string;
}

function toAbsoluteAvatarUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const baseURL = axiosClient.defaults.baseURL ?? '';
  const normalizedBase = baseURL.replace(/\/api\/v1\/?$/, '');
  return `${normalizedBase}${rawUrl}`;
}

function normalizeUserProfile(raw: RawUserProfile): UserProfile {
  const createdAt = raw.createdAt ?? raw.created_at ?? '';
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;

  return {
    id: String(raw.id ?? ''),
    username: raw.username ?? '',
    email: raw.email ?? '',
    fullName: raw.fullName ?? raw.full_name ?? null,
    avatarUrl: toAbsoluteAvatarUrl(raw.avatarUrl ?? raw.avatar_url),
    role: raw.role === 'admin' ? 'admin' : 'user',
    createdAt,
    updatedAt,
  };
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await axiosClient.get<RawUserProfile>('/users/me');
  return normalizeUserProfile(response.data);
}

export async function updateMyProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  const response = await axiosClient.patch<RawUserProfile>('/users/me', payload);
  return normalizeUserProfile(response.data);
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axiosClient.post<RawUserProfile>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return normalizeUserProfile(response.data);
}

export async function deleteMyAvatar(): Promise<UserProfile> {
  const response = await axiosClient.delete<RawUserProfile>('/users/me/avatar');
  return normalizeUserProfile(response.data);
}

export async function deleteMyAccount(): Promise<void> {
  await axiosClient.delete('/users/me');
}
