import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle, Sparkles, BookOpen, TrendingUp, Shield } from 'lucide-react';
import { handleApiError, checkApiAvailability } from '../utils/apiErrorHandler';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { authFormStyles, authCardStyles, authHeaderStyles, authErrorStyles, authInfoPanelStyles } from './auth';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Проверка доступности API при загрузке
  useEffect(() => {
    checkApiAvailability().then(setApiAvailable);
  }, []);

  // Перенаправление после успешного входа (только если мы на странице авторизации)
  useEffect(() => {
    if (user && window.location.pathname === '/auth') {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Валидация
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.message || 'Неверное имя пользователя');
      return;
    }

    if (!isLogin) {
      if (!validateEmail(email)) {
        setError('Введите корректный email адрес');
        return;
      }
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Неверный пароль');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
        toast.success('Успешный вход!');
        resetForm();
        // Перенаправление произойдет через useEffect при обновлении user
      } else {
        await register(username, email, password, fullName);
        toast.success('Регистрация успешна! Добро пожаловать!');
        resetForm();
        // Перенаправление произойдет через useEffect при обновлении user
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая половина - Белая форма авторизации */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
        
        <div className="w-full max-w-md relative z-10">
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
              <Label htmlFor="auth-username" className={authFormStyles.label}>
                <UserIcon className="h-4 w-4" />
                USERNAME
              </Label>
              <Input
                id="auth-username"
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
                  <Label htmlFor="auth-email" className={authFormStyles.label}>
                    <Mail className="h-4 w-4" />
                    EMAIL
                  </Label>
                  <Input
                    id="auth-email"
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
                  <Label htmlFor="auth-fullName" className={authFormStyles.label}>
                    <UserIcon className="h-4 w-4" />
                    ИМЯ (необязательно)
                  </Label>
                  <Input
                    id="auth-fullName"
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
              <Label htmlFor="auth-password" className={authFormStyles.label}>
                <Lock className="h-4 w-4" />
                PASSWORD
              </Label>
              <Input
                id="auth-password"
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
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }}
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
      </div>

      {/* Правая половина - Черная информационная панель */}
      <div className={`hidden md:flex md:w-1/2 ${authInfoPanelStyles.container}`}>
        {/* Декоративные элементы */}
        <div className={authInfoPanelStyles.decorative} />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
        
        <div className={authInfoPanelStyles.content}>
          {/* Логотип/Иконка */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 border-2 border-white flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-mono font-bold tracking-wider">HYPE</h2>
          </div>

          {/* Заголовок */}
          <h3 className="text-4xl font-mono font-bold leading-tight mb-4">
            Добро пожаловать в платформу обучения
          </h3>

          {/* Описание */}
          <p className="text-lg text-gray-300 leading-relaxed font-mono">
            Присоединяйтесь к сообществу студентов и преподавателей. 
            Изучайте новые навыки, отслеживайте прогресс и достигайте своих целей.
          </p>

          {/* Особенности */}
          <div className="space-y-6 mt-10">
            <div className={authInfoPanelStyles.featureItem}>
              <div className={authInfoPanelStyles.featureIcon}>
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-lg mb-1">Интерактивные курсы</h4>
                <p className="text-gray-400 font-mono text-sm">
                  Изучайте материал в удобном для вас темпе с практическими заданиями
                </p>
              </div>
            </div>

            <div className={authInfoPanelStyles.featureItem}>
              <div className={authInfoPanelStyles.featureIcon}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-lg mb-1">Отслеживание прогресса</h4>
                <p className="text-gray-400 font-mono text-sm">
                  Видите свой прогресс в реальном времени и достигайте новых высот
                </p>
              </div>
            </div>

            <div className={authInfoPanelStyles.featureItem}>
              <div className={authInfoPanelStyles.featureIcon}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-lg mb-1">Безопасность данных</h4>
                <p className="text-gray-400 font-mono text-sm">
                  Ваши данные защищены современными стандартами безопасности
                </p>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-12 pt-8 border-t-2 border-white/20">
            <p className="text-sm text-gray-400 font-mono">
              Начните свое обучение уже сегодня
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

