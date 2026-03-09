import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { ApiErrorResponse } from '../types/user-profile';

interface ProfileRoutePageProps {
  onUnauthorized: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date);
}

export function ProfileRoutePage({ onUnauthorized }: ProfileRoutePageProps) {
  const { isAuthenticated, logout } = useAuth();
  const { data, isLoading, error } = useUserProfile(isAuthenticated);

  useEffect(() => {
    if (!error) {
      return;
    }

    const status = (error as AxiosError<ApiErrorResponse>).response?.status;
    if (status === 401) {
      logout();
      onUnauthorized();
    }
  }, [error, logout, onUnauthorized]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-xl border-2 border-black bg-white p-6">
          <p className="font-mono text-sm uppercase tracking-wide">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to load profile.';
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-xl border-2 border-black bg-white p-6 space-y-4">
          <p className="font-mono text-sm uppercase tracking-wide text-red-600">Profile request error</p>
          <p className="font-mono text-sm">{message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mx-auto max-w-xl border-2 border-black bg-white p-6 space-y-4">
        <h1 className="font-mono text-2xl uppercase tracking-wide">Profile</h1>

        <div className="space-y-2 font-mono text-sm">
          <p><span className="font-bold">Name:</span> {data.fullName || '-'}</p>
          <p><span className="font-bold">Username:</span> {data.username}</p>
          <p><span className="font-bold">Email:</span> {data.email}</p>
          <p><span className="font-bold">Registered:</span> {formatDate(data.createdAt)}</p>
          <p><span className="font-bold">Updated:</span> {formatDate(data.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
