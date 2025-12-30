import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { handleApiError, checkApiAvailability } from '../utils/apiErrorHandler';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
        toast.success('Успешный вход!');
        // Перенаправление произойдет через useEffect при обновлении user
      } else {
        await register(username, email, password, fullName);
        toast.success('Регистрация успешна! Добро пожаловать!');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black rounded-full blur-3xl" />
        </div>
      </div>

      <Card className="w-full max-w-md border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white mb-4 relative">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-black bg-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-black bg-white" />
              {isLogin ? (
                <LogIn className="h-8 w-8" />
              ) : (
                <UserPlus className="h-8 w-8" />
              )}
            </div>
            <h1 className="text-3xl font-mono font-bold tracking-wider mb-2">
              {isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {isLogin 
                ? 'Войдите в свой аккаунт для продолжения' 
                : 'Создайте новый аккаунт для начала обучения'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono text-xs uppercase tracking-wide flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                USERNAME
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-2 border-black font-mono h-12"
                placeholder="Введите имя пользователя"
                required
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wide flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 border-black font-mono h-12"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-mono text-xs uppercase tracking-wide flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    ИМЯ (необязательно)
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-2 border-black font-mono h-12"
                    placeholder="Ваше полное имя"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wide flex items-center gap-2">
                <Lock className="h-4 w-4" />
                PASSWORD
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-black font-mono h-12"
                placeholder="Введите пароль"
                required
                disabled={loading}
              />
            </div>

          {apiAvailable === false && (
            <div className="p-4 border-2 border-orange-500 bg-orange-50 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-mono text-orange-600">
                Backend недоступен. Убедитесь, что сервер запущен на порту 8000.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 border-2 border-red-500 bg-red-50 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-mono text-red-600">{error}</p>
            </div>
          )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono tracking-wide text-base transition-all disabled:opacity-50"
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setPassword('');
                }}
                className="text-sm font-mono underline hover:no-underline text-muted-foreground"
                disabled={loading}
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 border-2 border-black bg-gray-50">
            <p className="text-xs font-mono mb-2 font-bold uppercase tracking-wide">ДЕМО-ДОСТУП:</p>
            <div className="space-y-1 text-xs font-mono">
              <p><strong>Пользователь:</strong> demo / demo123</p>
              <p><strong>Админ:</strong> admin / admin123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

