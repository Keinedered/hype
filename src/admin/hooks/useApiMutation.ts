import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { invalidateCache } from './useApiQuery';

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: string[];
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
}

interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> {
  const {
    onSuccess,
    onError,
    invalidateQueries = [],
    showSuccessToast = true,
    successMessage = 'Операция выполнена успешно',
    showErrorToast = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);

        // Инвалидируем кэш для указанных запросов
        invalidateQueries.forEach(pattern => {
          invalidateCache(pattern);
        });

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(result, variables);
        }

        setLoading(false);
        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);

        if (showErrorToast) {
          toast.error(error.message || 'Произошла ошибка');
        }

        if (onError) {
          onError(error, variables);
        }

        throw error;
      }
    },
    [mutationFn, onSuccess, onError, invalidateQueries, showSuccessToast, successMessage, showErrorToast]
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        // Ошибка уже обработана в mutateAsync
        return undefined;
      }
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    reset,
  };
}

