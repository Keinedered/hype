import { axiosClient } from './axiosClient';
import { AdminUserDetail, AdminUserListItem, ResetPasswordResponse } from '../types/admin';

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
