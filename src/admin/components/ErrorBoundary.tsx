import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <Card className="bg-gray-900 border-gray-800 p-8 max-w-2xl w-full">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-red-500" size={48} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              Произошла ошибка
            </h1>
            <p className="text-gray-300 mb-4">
              Приложение столкнулось с неожиданной ошибкой. Пожалуйста, попробуйте обновить страницу или вернуться на главную.
            </p>
            
            {error && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                      Показать стек ошибки
                    </summary>
                    <pre className="text-gray-400 text-xs mt-2 overflow-auto max-h-40 font-mono">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={onReset}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="mr-2" size={16} />
                Попробовать снова
              </Button>
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Home className="mr-2" size={16} />
                На главную
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Обновить страницу
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

