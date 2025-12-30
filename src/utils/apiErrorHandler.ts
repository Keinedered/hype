/**
 * Утилита для обработки ошибок API
 */

export function handleApiError(error: unknown): string {
  if (error instanceof TypeError) {
    if (error.message === 'Failed to fetch') {
      return 'Не удалось подключиться к серверу. Убедитесь, что backend запущен и доступен.';
    }
    return `Ошибка сети: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Произошла неизвестная ошибка';
}

export function checkApiAvailability(): Promise<boolean> {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  
  return fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.ok)
    .catch(() => false);
}

