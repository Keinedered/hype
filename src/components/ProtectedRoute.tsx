import { ReactNode, useEffect } from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  onUnauthorized?: () => void;
  fallback?: ReactNode;
  children: ReactNode;
}

export function ProtectedRoute({
  isAuthenticated,
  isAuthLoading,
  onUnauthorized,
  fallback = null,
  children,
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      onUnauthorized?.();
    }
  }, [isAuthLoading, isAuthenticated, onUnauthorized]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-xl border-2 border-black bg-white p-6">
          <p className="font-mono text-sm uppercase tracking-wide">Checking auth...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
