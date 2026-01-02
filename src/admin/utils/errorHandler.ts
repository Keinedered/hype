/**
 * Централизованная обработка ошибок для админ-панели
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
  field?: string; // Для ошибок валидации полей
}

export class AppError extends Error {
  statusCode?: number;
  details?: any;
  field?: string;

  constructor(message: string, statusCode?: number, details?: any, field?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
  }
}

/**
 * Преобразует различные типы ошибок в стандартный формат
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      field: error.field,
    };
  }

  if (error instanceof Error) {
    // Пытаемся извлечь информацию из сообщения об ошибке
    const message = error.message;
    
    // Проверяем на сетевые ошибки
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return {
        message: 'Не удалось подключиться к серверу. Проверьте подключение к интернету.',
        statusCode: 0,
      };
    }

    // Проверяем на ошибки авторизации
    if (message.includes('Unauthorized') || message.includes('401')) {
      return {
        message: 'Требуется авторизация. Пожалуйста, войдите в систему.',
        statusCode: 401,
      };
    }

    return {
      message: message || 'Произошла неизвестная ошибка',
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  return {
    message: 'Произошла неизвестная ошибка',
  };
}

/**
 * Получает понятное сообщение об ошибке для пользователя
 */
export function getErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.message;
}

/**
 * Проверяет является ли ошибка ошибкой валидации
 */
export function isValidationError(error: unknown): boolean {
  const normalized = normalizeError(error);
  return !!normalized.field || normalized.statusCode === 400;
}

/**
 * Получает ошибки валидации полей из ответа API
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const normalized = normalizeError(error);
  const fieldErrors: Record<string, string> = {};

  if (normalized.field) {
    fieldErrors[normalized.field] = normalized.message;
  }

  if (normalized.details && typeof normalized.details === 'object') {
    // Обрабатываем стандартный формат FastAPI validation errors
    if (Array.isArray(normalized.details)) {
      for (const detail of normalized.details) {
        if (detail.loc && detail.msg) {
          const field = detail.loc[detail.loc.length - 1];
          fieldErrors[field] = detail.msg;
        }
      }
    } else if (typeof normalized.details === 'object') {
      // Обрабатываем объект с ошибками полей
      for (const [field, message] of Object.entries(normalized.details)) {
        if (typeof message === 'string') {
          fieldErrors[field] = message;
        } else if (Array.isArray(message)) {
          fieldErrors[field] = message[0] || 'Ошибка валидации';
        }
      }
    }
  }

  return fieldErrors;
}

/**
 * Логирует ошибку для отладки
 */
export function logError(error: unknown, context?: string) {
  const normalized = normalizeError(error);
  const logData = {
    message: normalized.message,
    statusCode: normalized.statusCode,
    details: normalized.details,
    field: normalized.field,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('Error logged:', logData);
  
  // В продакшене можно отправлять в систему мониторинга
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(logData);
  // }
}

