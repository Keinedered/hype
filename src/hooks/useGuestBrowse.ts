import { useAuth } from '../context/AuthContext';

/** Гость = не авторизован после завершения проверки токена (в т.ч. «Продолжить без входа»). */
export function useGuestBrowse() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  return {
    authLoading,
    isGuest: !authLoading && !isAuthenticated,
  };
}
