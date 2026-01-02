import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 p-12">
      <div className="flex flex-col items-center justify-center text-center">
        {Icon && (
          <div className="mb-4 p-4 bg-gray-800 rounded-full">
            <Icon className="text-gray-400" size={48} />
          </div>
        )}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-gray-300 text-sm max-w-md mb-6">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

