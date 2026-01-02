import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseApiQueryOptions {
  enabled?: boolean;
  retry?: number;
  retryDelay?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

// Простой кэш в памяти
const cache = new Map<string, { data: any; timestamp: number; cacheTime: number }>();

export function useApiQuery<T = any>(
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions = {}
): UseApiQueryResult<T> {
  const {
    enabled = true,
    retry = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5 минут по умолчанию
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  // Генерируем стабильный ключ кэша на основе функции запроса
  const queryKeyRef = useRef<string>('');
  if (!queryKeyRef.current) {
    // Создаем ключ на основе строкового представления функции
    const fnString = queryFn.toString();
    // Извлекаем URL или имя функции для более читаемого ключа
    const match = fnString.match(/\/admin\/(\w+)/) || fnString.match(/getAll|get|create|update/);
    const identifier = match ? match[0] : fnString.slice(0, 30);
    queryKeyRef.current = `query-${identifier}`;
  }
  const queryKey = queryKeyRef.current;
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeQuery = useCallback(async (skipCache = false) => {
    if (!enabled) return;

    // Проверяем кэш
    if (!skipCache && cache.has(queryKey)) {
      const cached = cache.get(queryKey)!;
      const now = Date.now();
      if (now - cached.timestamp < cached.cacheTime) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      } else {
        cache.delete(queryKey);
      }
    }

    setIsFetching(true);
    setError(null);

    // Отменяем предыдущий запрос если он есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const performRequest = async (attempt: number): Promise<void> => {
      try {
        const result = await queryFn();
        
        // Проверяем не был ли запрос отменен
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Сохраняем в кэш
        cache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          cacheTime,
        });

        setData(result);
        setLoading(false);
        setIsFetching(false);
        retryCountRef.current = 0;
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err: any) {
        // Проверяем не был ли запрос отменен
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        
        // Retry логика
        if (attempt < retry && !error.message.includes('Unauthorized')) {
          retryCountRef.current = attempt + 1;
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return performRequest(attempt + 1);
        }

        setError(error);
        setLoading(false);
        setIsFetching(false);
        retryCountRef.current = 0;

        if (onError) {
          onError(error);
        } else {
          // Только логируем, не показываем toast для query (чтобы не спамить)
          console.error('Query error:', error);
        }
      }
    };

    await performRequest(0);
  }, [queryFn, enabled, retry, retryDelay, cacheTime, onSuccess, onError, queryKey]);

  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  useEffect(() => {
    executeQuery();

    // Cleanup при размонтировании
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeQuery]);

  // Refetch при фокусе окна
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    isFetching,
  };
}

// Функция для инвалидации кэша
export function invalidateCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

