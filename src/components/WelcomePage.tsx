import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SmoothLinesBackground } from './ui/SmoothLinesBackground';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '../utils/apiErrorHandler';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { authFormStyles, authCardStyles, authHeaderStyles, authErrorStyles, authInfoCardStyles, authLogoStyles } from './auth';

export function WelcomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

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
      } else {
        await register(username, email, password, fullName);
        toast.success('Регистрация успешна! Добро пожаловать!');
      }
      resetForm();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-black selection:text-white">
      <SmoothLinesBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-7xl w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Левая часть - описание проекта */}
            <div className="w-full md:w-auto">
              <div className="max-w-md space-y-6">
              <div className={authLogoStyles.container}>
                <div className={authLogoStyles.badge}>
                  <h1 className="mb-0">GRAPH</h1>
                </div>
                <div className={authLogoStyles.cornerTop} />
                <div className={authLogoStyles.cornerBottom} />
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-border pl-6">
                  <h2 className="font-mono text-xl mb-3 tracking-wide font-bold text-foreground">О ПЛАТФОРМЕ</h2>
                  <p className="text-foreground font-mono leading-relaxed">
                    Образовательная платформа «GRAPH» — это инновационный подход к онлайн-обучению, 
                    где процесс освоения знаний визуализирован как путешествие по логическому графу.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className={authInfoCardStyles.container}>
                    <h3 className={authInfoCardStyles.title}>КАРТА ЗНАНИЙ</h3>
                    <p className={authInfoCardStyles.description}>
                      Увидьте структуру курса как логический граф с вершинами-темами и связями между ними. 
                      Исследуйте зависимости и выбирайте свой путь обучения.
                    </p>
                  </div>

                  <div className={authInfoCardStyles.container}>
                    <h3 className={authInfoCardStyles.title}>ИНТЕРАКТИВНОЕ ОБУЧЕНИЕ</h3>
                    <p className={authInfoCardStyles.description}>
                      Смотрите видео, читайте конспекты, работайтесь с хендбуком и выполняйте задания. 
                      Получайте обратную связь от кураторов.
                    </p>
                  </div>

                  <div className={authInfoCardStyles.container}>
                    <h3 className={authInfoCardStyles.title}>ЧЕТЫРЕ ТРЕКА</h3>
                    <p className={authInfoCardStyles.description}>
                      Ивент, Цифровые продукты, Внешние коммуникации, Дизайн — выберите направление, 
                      которое вас интересует.
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Правая часть - форма авторизации */}
            <div className="w-full md:w-auto">
              <div className={`w-[550px] ${authCardStyles.base}`}>
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
                      ? 'Войдите, чтобы начать обучение' 
                      : 'Создайте аккаунт для доступа к платформе'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={authFormStyles.container}>
                  <div className={authFormStyles.fieldGroup}>
                    <Label htmlFor="welcome-username" className={authFormStyles.label}>
                      <UserIcon className="h-4 w-4" />
                      USERNAME
                    </Label>
                    <Input
                      id="welcome-username"
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
                        <Label htmlFor="welcome-email" className={authFormStyles.label}>
                          <Mail className="h-4 w-4" />
                          EMAIL
                        </Label>
                        <Input
                          id="welcome-email"
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
                        <Label htmlFor="welcome-fullName" className={authFormStyles.label}>
                          <UserIcon className="h-4 w-4" />
                          ИМЯ (необязательно)
                        </Label>
                        <Input
                          id="welcome-fullName"
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
                    <Label htmlFor="welcome-password" className={authFormStyles.label}>
                      <Lock className="h-4 w-4" />
                      PASSWORD
                    </Label>
                    <Input
                      id="welcome-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={authFormStyles.input}
                      placeholder="Введите пароль"
                      required
                      disabled={loading}
                    />
                  </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
