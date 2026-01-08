/**
 * Утилита для логирования
 * Логи выводятся только в режиме разработки
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Ошибки всегда логируем
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  
  debug: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${tag}]`, ...args);
    }
  },
};

