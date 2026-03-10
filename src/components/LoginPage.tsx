import { FormEvent, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onAuthSuccess?: () => void;
}

type AuthMode = 'login' | 'signup';

export function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';

  useEffect(() => {
    if (isAuthenticated) {
      onAuthSuccess?.();
    }
  }, [isAuthenticated, onAuthSuccess]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password, fullName || undefined);
      }
      onAuthSuccess?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mx-auto max-w-md border-2 border-black bg-white p-6">
        <div className="mb-6">
          <h1 className="font-mono text-2xl uppercase tracking-wide">
            Profile
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Log in to your account or create a new one.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 border-2 border-black">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
              isLogin ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLoginTarget('user');
              setError('');
            }}
            className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
              !isLogin ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-mono text-xs uppercase">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="border-2 border-black font-mono"
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="border-2 border-black font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-mono text-xs uppercase">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="border-2 border-black font-mono"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs uppercase">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="border-2 border-black font-mono"
            />
          </div>

          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-3">
              <p className="font-mono text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono uppercase tracking-wide"
          >
            {isSubmitting
              ? 'Loading...'
              : isLogin
                ? 'Log in'
                : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
}
