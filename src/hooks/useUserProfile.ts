import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getMyProfile } from '../api/profile';
import { ApiErrorResponse, UserProfile } from '../types/user-profile';

export function useUserProfile(enabled: boolean) {
  return useQuery<UserProfile, AxiosError<ApiErrorResponse>>({
    queryKey: ['user-profile'],
    queryFn: getMyProfile,
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}
