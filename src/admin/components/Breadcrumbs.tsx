import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  homeLabel?: string;
}

export function Breadcrumbs({ items, homeLabel = 'Dashboard' }: BreadcrumbsProps) {
  const location = useLocation();

  // Автоматически генерируем breadcrumbs из пути если не переданы
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: homeLabel, path: '/admin' }];
    
    let currentPath = '/admin';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      result.push({
        label,
        path: index === paths.length - 1 ? undefined : currentPath,
      });
    });
    
    return result;
  })();

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index === 0 ? (
            <Link
              to={item.path || '/admin'}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Home size={16} />
            </Link>
          ) : (
            <>
              <ChevronRight className="text-gray-400" size={16} />
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white font-medium">{item.label}</span>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

