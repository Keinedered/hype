/**
 * Утилиты для валидации форм
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Пароль должен содержать минимум 6 символов' };
  }
  return { valid: true };
}

export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (username.length < 3) {
    return { valid: false, message: 'Имя пользователя должно содержать минимум 3 символа' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Имя пользователя может содержать только буквы, цифры и подчеркивание' };
  }
  return { valid: true };
}

