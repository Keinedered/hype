import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';

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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-black bg-white">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wide text-center">
            {isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
          </DialogTitle>
        </DialogHeader>

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
            className="w-full border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono tracking-wide"
          >
            {loading ? 'ЗАГРУЗКА...' : isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="w-full text-sm font-mono underline hover:no-underline"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
          </button>
        </form>

        <div className="mt-4 p-3 border-2 border-black bg-gray-50">
          <p className="text-xs font-mono mb-2">ДЕМО-ДОСТУП:</p>
          <p className="text-xs font-mono">Username: <strong>demo</strong></p>
          <p className="text-xs font-mono">Password: <strong>demo123</strong></p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

