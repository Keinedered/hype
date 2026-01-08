/**
 * Переиспользуемый компонент формы авторизации
 * Централизованная логика и стили для всех форм авторизации
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { authFormStyles, authCardStyles, authHeaderStyles, authErrorStyles } from './authStyles';

interface AuthFormProps {
  isLogin: boolean;
  onToggleMode: () => void;
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  apiAvailable?: boolean | null;
}

export interface AuthFormData {
  username: string;
  email?: string;
  password: string;
  fullName?: string;
}

export function AuthForm({
  isLogin,
  onToggleMode,
  onSubmit,
  loading = false,
  error,
  apiAvailable = null,
}: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      username,
      email: isLogin ? undefined : email,
      password,
      fullName: isLogin ? undefined : fullName,
    });
  };

  const handleToggle = () => {
    setPassword('');
    onToggleMode();
  };

  return (
    <div className={authCardStyles.base}>
      {/* Header */}
      <div className="mb-8">
        <div className={authHeaderStyles.iconContainer}>
          <div className={authHeaderStyles.iconCorner} />
          <div className={authHeaderStyles.iconCornerBottom} />
          {isLogin ? (
            <LogIn className="h-7 w-7" />
          ) : (
            <UserPlus className="h-7 w-7" />
          )}
        </div>
        <h1 className={authHeaderStyles.title}>
          {isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
        </h1>
        <p className={authHeaderStyles.subtitle}>
          {isLogin 
            ? 'Войдите в свой аккаунт для продолжения' 
            : 'Создайте новый аккаунт для начала обучения'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={authFormStyles.container}>
        <div className={authFormStyles.fieldGroup}>
          <Label htmlFor="username" className={authFormStyles.label}>
            <UserIcon className="h-4 w-4" />
            USERNAME
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={authFormStyles.input}
            placeholder="Введите имя пользователя"
            required
            disabled={loading}
          />
        </div>

        {!isLogin && (
          <>
            <div className={`${authFormStyles.fieldGroup} transition-all duration-300`}>
              <Label htmlFor="email" className={authFormStyles.label}>
                <Mail className="h-4 w-4" />
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authFormStyles.input}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className={`${authFormStyles.fieldGroup} transition-all duration-300`}>
              <Label htmlFor="fullName" className={authFormStyles.label}>
                <UserIcon className="h-4 w-4" />
                ИМЯ (необязательно)
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authFormStyles.input}
                placeholder="Ваше полное имя"
                disabled={loading}
              />
            </div>
          </>
        )}

        <div className={authFormStyles.fieldGroup}>
          <Label htmlFor="password" className={authFormStyles.label}>
            <Lock className="h-4 w-4" />
            PASSWORD
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authFormStyles.input}
            placeholder="Введите пароль"
            required
            disabled={loading}
          />
        </div>

        {apiAvailable === false && (
          <div className="p-4 border-2 border-orange-500 bg-orange-50 flex items-center gap-2 transition-all duration-300">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm font-mono text-orange-600">
              Backend недоступен. Убедитесь, что сервер запущен на порту 8000.
            </p>
          </div>
        )}

        {error && (
          <div className={authErrorStyles.container}>
            <AlertCircle className={authErrorStyles.icon} />
            <p className={authErrorStyles.text}>{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className={authFormStyles.button}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              ЗАГРУЗКА...
            </span>
          ) : (
            isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'
          )}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleToggle}
            className={authFormStyles.toggleButton}
            disabled={loading}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
          </button>
        </div>
      </form>

      {/* Demo Info */}
      <div className={`mt-8 ${authCardStyles.infoBox}`}>
        <p className={authCardStyles.infoTitle}>ДЕМО-ДОСТУП:</p>
        <div className={`space-y-1 ${authCardStyles.infoText}`}>
          <p><strong className="text-foreground">Пользователь:</strong> demo / demo123</p>
          <p><strong className="text-foreground">Админ:</strong> admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

