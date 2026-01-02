/**
 * Утилиты для валидации форм
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  url?: boolean;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Валидирует значение по правилам
 */
export function validateField(
  value: any,
  rules: ValidationRule,
  fieldName?: string
): string | null {
  const fieldLabel = fieldName || 'Поле';

  // Проверка на обязательность
  if (rules.required) {
    if (value === null || value === undefined || value === '') {
      return `${fieldLabel} обязательно для заполнения`;
    }
  }

  // Если поле не обязательное и пустое, пропускаем остальные проверки
  if (!value && !rules.required) {
    return null;
  }

  const stringValue = String(value);

  // Проверка минимальной длины
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldLabel} должно содержать минимум ${rules.minLength} символов`;
  }

  // Проверка максимальной длины
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldLabel} должно содержать максимум ${rules.maxLength} символов`;
  }

  // Проверка паттерна
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldLabel} имеет неверный формат`;
  }

  // Проверка email
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return `${fieldLabel} должно быть валидным email адресом`;
    }
  }

  // Проверка URL
  if (rules.url) {
    try {
      new URL(stringValue);
    } catch {
      return `${fieldLabel} должно быть валидным URL`;
    }
  }

  // Кастомная валидация
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}

/**
 * Валидирует объект данных по правилам
 */
export function validateForm(
  data: Record<string, any>,
  rules: ValidationRules
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    const error = validateField(value, fieldRules, field);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Проверяет уникальность ID (для валидации на клиенте)
 */
export function createUniqueIdValidator(
  existingIds: string[],
  currentId?: string
): (value: string) => string | null {
  return (value: string) => {
    if (!value) return null;
    
    const normalizedValue = value.trim().toLowerCase();
    const normalizedExisting = existingIds.map(id => id.trim().toLowerCase());
    
    // Игнорируем текущий ID при редактировании
    if (currentId && normalizedValue === currentId.trim().toLowerCase()) {
      return null;
    }
    
    if (normalizedExisting.includes(normalizedValue)) {
      return 'ID уже используется. Выберите другой.';
    }
    
    // Проверка формата ID (только латиница, цифры, дефисы, подчеркивания)
    if (!/^[a-z0-9_-]+$/.test(normalizedValue)) {
      return 'ID может содержать только латинские буквы, цифры, дефисы и подчеркивания';
    }
    
    return null;
  };
}

/**
 * Генерирует ID из названия
 */
export function generateIdFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .replace(/^-|-$/g, ''); // Убираем дефисы в начале и конце
}

