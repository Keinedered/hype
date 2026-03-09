import { axiosClient } from './axiosClient';
import { UserProfile } from '../types/user-profile';

export async function getMyProfile(): Promise<UserProfile> {
  const response = await axiosClient.get<UserProfile>('/users/me');
  return response.data;
}

