import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '../utils/errorHandler';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
}

export function ErrorState({ 
  error, 
  onRetry, 
  title = 'Произошла ошибка',
  showDetails = false
}: ErrorStateProps) {
  const errorMessage = getErrorMessage(error);
  const errorDetails = error instanceof Error ? error.stack : String(error);

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm mb-4">{errorMessage}</p>
          
          {showDetails && errorDetails && (
            <details className="mb-4">
              <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300 mb-2">
                Показать детали ошибки
              </summary>
              <pre className="text-gray-400 text-xs overflow-auto max-h-40 font-mono bg-gray-800 p-3 rounded">
                {errorDetails}
              </pre>
            </details>
          )}

          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2" size={16} />
              Попробовать снова
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

