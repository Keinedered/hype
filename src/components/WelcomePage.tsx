import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { SmoothLinesBackground } from './ui/SmoothLinesBackground';

export function WelcomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password, fullName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-black selection:text-white">
      <SmoothLinesBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Левая часть - описание проекта */}
            <div className="space-y-6">
              <div className="relative inline-block mb-6">
                <div className="bg-black text-white px-8 py-4 inline-block font-mono tracking-wider text-2xl">
                  <h1 className="mb-0">GRAPH</h1>
                </div>
                <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
                <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-black pl-6">
                  <h2 className="font-mono text-xl mb-3 tracking-wide">О ПЛАТФОРМЕ</h2>
                  <p className="text-foreground font-mono leading-relaxed">
                    Образовательная платформа «GRAPH» — это инновационный подход к онлайн-обучению, 
                    где процесс освоения знаний визуализирован как путешествие по логическому графу.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-white border-2 border-black p-4">
                    <h3 className="font-mono font-bold mb-2 tracking-wide">КАРТА ЗНАНИЙ</h3>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      Увидьте структуру курса как логический граф с вершинами-темами и связями между ними. 
                      Исследуйте зависимости и выбирайте свой путь обучения.
                    </p>
                  </div>

                  <div className="bg-white border-2 border-black p-4">
                    <h3 className="font-mono font-bold mb-2 tracking-wide">ИНТЕРАКТИВНОЕ ОБУЧЕНИЕ</h3>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      Смотрите видео, читайте конспекты, работайте с хендбуком и выполняйте задания. 
                      Получайте обратную связь от кураторов.
                    </p>
                  </div>

                  <div className="bg-white border-2 border-black p-4">
                    <h3 className="font-mono font-bold mb-2 tracking-wide">ЧЕТЫРЕ ТРЕКА</h3>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      Ивент, Цифровые продукты, Внешние коммуникации, Дизайн — выберите направление, 
                      которое вас интересует.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая часть - форма авторизации */}
            <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-6">
                <div className="bg-black text-white px-4 py-2 inline-block font-mono text-sm tracking-wide mb-4">
                  {isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {isLogin 
                    ? 'Войдите, чтобы начать обучение' 
                    : 'Создайте аккаунт для доступа к платформе'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-mono text-xs">
                    USERNAME
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border-2 border-black font-mono"
                    required
                    disabled={loading}
                  />
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-xs">
                        EMAIL
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-2 border-black font-mono"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-mono text-xs">
                        ИМЯ (необязательно)
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-2 border-black font-mono"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-mono text-xs">
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-2 border-black font-mono"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 border-2 border-red-500 bg-red-50">
                    <p className="text-sm font-mono text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono tracking-wide transition-all"
                >
                  {loading ? 'ЗАГРУЗКА...' : isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="w-full text-sm font-mono underline hover:no-underline text-center"
                  disabled={loading}
                >
                  {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
                </button>
              </form>

              <div className="mt-6 p-3 border-2 border-black bg-gray-50">
                <p className="text-xs font-mono mb-2 font-bold">ДЕМО-ДОСТУП:</p>
                <p className="text-xs font-mono">Username: <strong>demo</strong></p>
                <p className="text-xs font-mono">Password: <strong>demo123</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

