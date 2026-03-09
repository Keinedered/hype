import { axiosClient } from './axiosClient';
import { UserProfile } from '../types/user-profile';

interface RawUserProfile {
  id?: string | number;
  username?: string;
  email?: string;
  fullName?: string | null;
  full_name?: string | null;
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

function normalizeUserProfile(raw: RawUserProfile): UserProfile {
  const createdAt = raw.createdAt ?? raw.created_at ?? '';
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;

  return {
    id: String(raw.id ?? ''),
    username: raw.username ?? '',
    email: raw.email ?? '',
    fullName: raw.fullName ?? raw.full_name ?? null,
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
