import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onSort,
  emptyMessage = 'Нет данных для отображения',
  className = '',
}: DataTableProps<T>) {
  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(data.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = total ? data : data.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card className={`bg-gray-900 border-gray-800 p-8 ${className}`}>
        <div className="text-center text-gray-300">Загрузка...</div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`bg-gray-900 border-gray-800 p-8 ${className}`}>
        <div className="text-center text-gray-300">{emptyMessage}</div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-300 bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && onSort && (
                        <button
                          onClick={() => onSort(column.key, 'asc')}
                          className="text-gray-400 hover:text-gray-300"
                          aria-label={`Сортировать по ${column.header}`}
                        >
                          ↕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-300">
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/50">
            <div className="text-sm text-gray-300">
              Показано {startIndex + 1}–{Math.min(endIndex, total || data.length)} из {total || data.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                className="text-gray-300 hover:text-white disabled:opacity-50"
              >
                <ChevronsLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="text-gray-300 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-gray-300 px-2">
                Страница {page} из {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="text-gray-300 hover:text-white disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                className="text-gray-300 hover:text-white disabled:opacity-50"
              >
                <ChevronsRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

