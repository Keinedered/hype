/**
 * Утилиты для retry механизма
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
};

/**
 * Выполняет функцию с retry механизмом
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxAttempts, delay, backoff, shouldRetry } = opts;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Проверяем нужно ли повторять попытку
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }

      // Не повторяем для последней попытки
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Вычисляем задержку
      const currentDelay = backoff === 'exponential'
        ? delay * Math.pow(2, attempt)
        : delay * (attempt + 1);

      // Ждем перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Проверяет нужно ли повторять запрос для данной ошибки
 */
export function shouldRetryRequest(error: Error): boolean {
  // Не повторяем для ошибок авторизации
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    return false;
  }

  // Не повторяем для ошибок валидации
  if (error.message.includes('400') || error.message.includes('validation')) {
    return false;
  }

  // Не повторяем для ошибок "не найдено"
  if (error.message.includes('404') || error.message.includes('not found')) {
    return false;
  }

  // Повторяем для сетевых ошибок и ошибок сервера
  return true;
}

