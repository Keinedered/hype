import { useState, useCallback, useMemo } from 'react';
import { validateForm, validateField as validateFieldUtil, ValidationRules, ValidationErrors } from '../utils/validation';

interface UseFormValidationOptions {
  rules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions
) {
  const { rules, validateOnChange = true, validateOnBlur = true } = options;
  
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Валидация всех полей
  const validate = useCallback((): boolean => {
    const validationErrors = validateForm(data, rules);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [data, rules]);

  // Валидация одного поля
  const validateField = useCallback(
    (field: string) => {
      const fieldRules = rules[field];
      if (!fieldRules) return;

      const fieldValue = data[field];
      const error = validateFieldUtil(fieldValue, fieldRules, field);
      
      setErrors((prev) => {
        if (error) {
          return { ...prev, [field]: error };
        } else {
          const { [field]: _, ...rest } = prev;
          return rest;
        }
      });
    },
    [data, rules]
  );

  // Обновление значения поля
  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setData((prev) => ({ ...prev, [field]: value }));
      
      if (validateOnChange && touched[field]) {
        validateField(field);
      }
    },
    [validateOnChange, touched, validateField]
  );

  // Обработка blur события
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      
      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField]
  );

  // Сброс формы
  const reset = useCallback((newData?: T) => {
    setData(newData || initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  // Получение ошибки поля
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  // Проверка валидности поля
  const isFieldValid = useCallback(
    (field: string): boolean => {
      return !errors[field];
    },
    [errors]
  );

  // Проверка валидности всей формы
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Проверка был ли поле тронуто
  const isFieldTouched = useCallback(
    (field: string): boolean => {
      return touched[field] || false;
    },
    [touched]
  );

  return {
    data,
    errors,
    touched,
    setData,
    setFieldValue,
    handleBlur,
    validate,
    validateField,
    reset,
    getFieldError,
    isFieldValid,
    isValid,
    isFieldTouched,
  };
}

