import { ReactNode, useEffect } from 'react';
import type { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  onUnauthorized?: () => void;
  fallback?: ReactNode;
  children: ReactNode;
  requireRole?: UserRole;
  userRole?: UserRole;
  onForbidden?: () => void;
}

export function ProtectedRoute({
  isAuthenticated,
  isAuthLoading,
  onUnauthorized,
  fallback = null,
  children,
  requireRole,
  userRole,
  onForbidden,
}: ProtectedRouteProps) {
  const lacksRole = !!requireRole && userRole !== requireRole;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      onUnauthorized?.();
      return;
    }

    if (!isAuthLoading && isAuthenticated && lacksRole) {
      onForbidden?.();
    }
  }, [isAuthLoading, isAuthenticated, lacksRole, onUnauthorized, onForbidden]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-xl border-2 border-black bg-white p-6">
          <p className="font-mono text-sm uppercase tracking-wide">Checking auth...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || lacksRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

