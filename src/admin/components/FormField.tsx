import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  onBlur?: () => void;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'input';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  modal?: boolean;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, error, required, hint, className = '', onBlur } = props;

  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className="text-gray-200">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {props.type === 'input' && (
        <Input
          id={fieldId}
          type={props.inputType || 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={props.placeholder}
          className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 ${
            error ? 'border-red-500 focus:border-red-500' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        />
      )}

      {props.type === 'textarea' && (
        <Textarea
          id={fieldId}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={props.placeholder}
          rows={props.rows || 4}
          className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 font-mono text-sm ${
            error ? 'border-red-500 focus:border-red-500' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        />
      )}

      {props.type === 'select' && (
        <Select modal={props.modal !== undefined ? props.modal : false} value={props.value} onValueChange={props.onChange}>
          <SelectTrigger
            id={fieldId}
            className={`bg-gray-800 border-gray-700 text-white ${
              error ? 'border-red-500 focus:border-red-500' : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          >
            <SelectValue placeholder={props.placeholder || 'Выберите...'} />
          </SelectTrigger>
          <SelectContent className="!bg-gray-800 border-gray-700 text-white">
            {props.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="hover:bg-gray-700"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-gray-400 text-xs">
          {hint}
        </p>
      )}

      {error && (
        <div id={`${fieldId}-error`} className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

