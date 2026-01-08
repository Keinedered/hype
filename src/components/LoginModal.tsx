import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle, Sparkles, BookOpen, TrendingUp, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '../utils/apiErrorHandler';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { authFormStyles, authCardStyles, authHeaderStyles, authErrorStyles, authInfoPanelStyles } from './auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
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

  const handleClose = () => {
    resetForm();
    setIsLogin(true);
    onClose();
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
      handleClose();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-5xl w-[95vw] h-[90vh] max-h-[800px] overflow-hidden">
        <div className={`flex h-full bg-card border-2 border-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}>
          {/* Левая половина - Белая форма */}
          <div className="w-full md:w-1/2 bg-card flex flex-col p-6 md:p-8 relative overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground mb-4 relative transition-transform duration-300 hover:scale-105">
                <div className={authHeaderStyles.iconCorner} />
                <div className={authHeaderStyles.iconCornerBottom} />
                {isLogin ? (
                  <LogIn className="h-6 w-6" />
                ) : (
                  <UserPlus className="h-6 w-6" />
                )}
              </div>
              <DialogTitle className="text-3xl font-mono font-bold tracking-wider mb-2 text-foreground">
                {isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-mono">
                {isLogin 
                  ? 'Войдите в свой аккаунт для продолжения' 
                  : 'Создайте новый аккаунт для начала обучения'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={`${authFormStyles.container} flex-1`}>
              <div className={authFormStyles.fieldGroup}>
                <Label htmlFor="modal-username" className={authFormStyles.label}>
                  <UserIcon className="h-4 w-4" />
                  USERNAME
                </Label>
                <Input
                  id="modal-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${authFormStyles.input} h-11`}
                  placeholder="Введите имя пользователя"
                  required
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <>
                  <div className={`${authFormStyles.fieldGroup} transition-all duration-300`}>
                    <Label htmlFor="modal-email" className={authFormStyles.label}>
                      <Mail className="h-4 w-4" />
                      EMAIL
                    </Label>
                    <Input
                      id="modal-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${authFormStyles.input} h-11`}
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className={`${authFormStyles.fieldGroup} transition-all duration-300`}>
                    <Label htmlFor="modal-fullName" className={authFormStyles.label}>
                      <UserIcon className="h-4 w-4" />
                      ИМЯ (необязательно)
                    </Label>
                    <Input
                      id="modal-fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${authFormStyles.input} h-11`}
                      placeholder="Ваше полное имя"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className={authFormStyles.fieldGroup}>
                <Label htmlFor="modal-password" className={authFormStyles.label}>
                  <Lock className="h-4 w-4" />
                  PASSWORD
                </Label>
                <Input
                  id="modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authFormStyles.input} h-11`}
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
                className={`${authFormStyles.button} h-12`}
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
            <div className={`mt-6 ${authCardStyles.infoBox}`}>
              <p className={authCardStyles.infoTitle}>ДЕМО-ДОСТУП:</p>
              <div className={`space-y-1 ${authCardStyles.infoText}`}>
                <p><strong className="text-foreground">Пользователь:</strong> demo / demo123</p>
                <p><strong className="text-foreground">Админ:</strong> admin / admin123</p>
              </div>
            </div>
          </div>

          {/* Правая половина - Черная информационная панель */}
          <div className={`hidden md:flex md:w-1/2 ${authInfoPanelStyles.container} p-8 overflow-y-auto`}>
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-6">
              {/* Логотип/Иконка */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-mono font-bold tracking-wider">HYPE</h2>
              </div>

              {/* Заголовок */}
              <h3 className="text-3xl font-mono font-bold leading-tight mb-3">
                Добро пожаловать в платформу обучения
              </h3>

              {/* Описание */}
              <p className="text-base text-gray-300 leading-relaxed font-mono">
                Присоединяйтесь к сообществу студентов и преподавателей. 
                Изучайте новые навыки, отслеживайте прогресс и достигайте своих целей.
              </p>

              {/* Особенности */}
              <div className="space-y-5 mt-8">
                <div className={authInfoPanelStyles.featureItem}>
                  <div className={`${authInfoPanelStyles.featureIcon} w-9 h-9`}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-base mb-1">Интерактивные курсы</h4>
                    <p className="text-gray-400 font-mono text-xs">
                      Изучайте материал в удобном для вас темпе
                    </p>
                  </div>
                </div>

                <div className={authInfoPanelStyles.featureItem}>
                  <div className={`${authInfoPanelStyles.featureIcon} w-9 h-9`}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-base mb-1">Отслеживание прогресса</h4>
                    <p className="text-gray-400 font-mono text-xs">
                      Видите свой прогресс в реальном времени
                    </p>
                  </div>
                </div>

                <div className={authInfoPanelStyles.featureItem}>
                  <div className={`${authInfoPanelStyles.featureIcon} w-9 h-9`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-base mb-1">Безопасность данных</h4>
                    <p className="text-gray-400 font-mono text-xs">
                      Ваши данные защищены современными стандартами
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

