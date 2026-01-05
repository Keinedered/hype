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
  queryKey?: string; // Явный ключ кэша для лучшего контроля
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
    queryKey: explicitQueryKey,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  // Генерируем стабильный ключ кэша на основе функции запроса
  const queryKeyRef = useRef<string>('');
  const queryFnRef = useRef(queryFn);
  
  // Обновляем ref при изменении queryFn
  queryFnRef.current = queryFn;
  
  // Генерируем ключ кэша один раз при первом рендере
  if (!queryKeyRef.current) {
    // Если явный ключ указан, используем его
    if (explicitQueryKey) {
      queryKeyRef.current = explicitQueryKey.startsWith('query-') ? explicitQueryKey : `query-${explicitQueryKey}`;
      console.log('[useApiQuery] Using explicit cache key:', queryKeyRef.current);
    } else {
      // Создаем ключ на основе строкового представления функции
      const fnString = queryFn.toString();
      console.log('[useApiQuery] Function string for key generation:', fnString.substring(0, 200));
      
      // Извлекаем URL или имя функции для более читаемого ключа
      // Приоритет: /admin/courses -> courses, /admin/modules -> modules и т.д.
      let identifier = '';
      
      // Сначала ищем URL в строке функции
      const adminMatch = fnString.match(/\/admin\/(\w+)/);
      if (adminMatch) {
        identifier = adminMatch[1]; // Извлекаем только название ресурса (courses, modules, lessons)
      } else {
        const apiMatch = fnString.match(/\/api\/v1\/(\w+)/);
        if (apiMatch) {
          identifier = apiMatch[1];
        } else {
          // Если URL не найден, пытаемся определить по контексту вызова
          // Проверяем, есть ли в строке упоминания courses, modules, lessons
          if (fnString.includes('modules') || fnString.includes('Modules') || fnString.includes('.modules.')) {
            identifier = 'modules';
          } else if (fnString.includes('courses') || fnString.includes('Courses') || fnString.includes('.courses.')) {
            identifier = 'courses';
          } else if (fnString.includes('lessons') || fnString.includes('Lessons') || fnString.includes('.lessons.')) {
            identifier = 'lessons';
          } else {
            const methodMatch = fnString.match(/(getAll|get|create|update)/);
            identifier = methodMatch ? methodMatch[0] : fnString.slice(0, 50);
          }
        }
      }
      queryKeyRef.current = `query-${identifier}`;
      console.log('[useApiQuery] Generated cache key:', queryKeyRef.current);
    }
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
        // Используем данные из кэша как есть (уже нормализованы)
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
        const result = await queryFnRef.current();
        
        // Проверяем не был ли запрос отменен
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Нормализуем результат: если null/undefined, пытаемся определить тип ожидаемого результата
        // Для списков возвращаем пустой массив, для объектов - null (чтобы не ломать логику проверок)
        let normalizedResult = result;
        if (result === null || result === undefined) {
          // Проверяем, ожидается ли массив на основе ключа кэша
          const isListQuery = queryKey.includes('getAll') || queryKey.includes('list') || queryKey.includes('courses') || queryKey.includes('modules') || queryKey.includes('lessons');
          normalizedResult = isListQuery ? [] : null;
          console.log(`[useApiQuery] Normalized null/undefined result for ${queryKey}:`, normalizedResult);
        } else {
          console.log(`[useApiQuery] Received result for ${queryKey}:`, result, 'Type:', Array.isArray(result) ? 'array' : typeof result, 'Length:', Array.isArray(result) ? result.length : 'N/A');
          if (Array.isArray(result)) {
            console.log(`[useApiQuery] Array items for ${queryKey}:`, result.map((item: any, idx: number) => ({ index: idx, id: item?.id, title: item?.title })));
          }
        }

        // Сохраняем в кэш
        console.log(`[useApiQuery] Setting data for ${queryKey}:`, normalizedResult, 'Length:', Array.isArray(normalizedResult) ? normalizedResult.length : 'N/A');
        cache.set(queryKey, {
          data: normalizedResult,
          timestamp: Date.now(),
          cacheTime,
        });

        console.log(`[useApiQuery] Setting state data for ${queryKey}, length:`, Array.isArray(normalizedResult) ? normalizedResult.length : 'N/A');
        setData(normalizedResult);
        setLoading(false);
        setIsFetching(false);
        retryCountRef.current = 0;
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err: any) {
        // Проверяем не был ли запрос отменен
        if (abortControllerRef.current?.signal.aborted) {
          console.log(`[useApiQuery] Request aborted for ${queryKey}`);
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[useApiQuery] Error for ${queryKey} (attempt ${attempt + 1}/${retry + 1}):`, error);
        
        // Retry логика
        if (attempt < retry && !error.message.includes('Unauthorized')) {
          retryCountRef.current = attempt + 1;
          console.log(`[useApiQuery] Retrying ${queryKey} in ${retryDelay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return performRequest(attempt + 1);
        }

        console.error(`[useApiQuery] Final error for ${queryKey} after ${attempt + 1} attempts:`, error);
        setError(error);
        setLoading(false);
        setIsFetching(false);
        retryCountRef.current = 0;

        if (onError) {
          onError(error);
        } else {
          // Только логируем, не показываем toast для query (чтобы не спамить)
          console.error(`[useApiQuery] Query error for ${queryKey}:`, error);
        }
      }
    };

    await performRequest(0);
  }, [enabled, retry, retryDelay, cacheTime, onSuccess, onError, queryKey]);

  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  useEffect(() => {
    if (enabled) {
      console.log(`[useApiQuery] Executing query for ${queryKey}, enabled:`, enabled);
      executeQuery();
    } else {
      console.log(`[useApiQuery] Query ${queryKey} is disabled, skipping execution`);
    }

    // Cleanup при размонтировании
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, executeQuery, queryKey]);

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

