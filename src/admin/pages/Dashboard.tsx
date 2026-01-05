import { Card } from '@/components/ui/card';
import { BookOpen, Users, ClipboardCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { useApiQuery } from '../hooks';
import { LoadingState, ErrorState } from '../components';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { filterFixedCourses } from '../utils/fixedCourses';

export function Dashboard() {
  // Загружаем данные параллельно
  const { data: coursesData, loading: coursesLoading, error: coursesError, refetch: refetchCourses } = useApiQuery(
    () => adminAPI.courses.getAll(),
    { cacheTime: 2 * 60 * 1000 } // 2 минуты
  );
  
  const { data: submissions, loading: submissionsLoading } = useApiQuery(
    () => adminAPI.submissions.getAll('pending'),
    { cacheTime: 1 * 60 * 1000 } // 1 минута
  );

  const { data: users, loading: usersLoading } = useApiQuery(
    () => adminAPI.users.getAll(),
    { cacheTime: 5 * 60 * 1000 } // 5 минут
  );

  const { data: analytics, loading: analyticsLoading } = useApiQuery(
    () => adminAPI.analytics.get('all'),
    { cacheTime: 5 * 60 * 1000 } // 5 минут
  );

  // Фильтруем только фиксированные курсы (4 курса)
  // Пустой массив [] - это валидные данные (нет курсов), а не отсутствие данных
  const courses = filterFixedCourses(Array.isArray(coursesData) ? coursesData : []);

  // Показываем загрузку пока идет загрузка данных
  // Пустой массив [] означает "нет данных", а не "данные не загружены"
  const loading = coursesLoading || submissionsLoading || usersLoading || analyticsLoading;

  // Вычисляем статистику
  const stats = {
    courses: courses.length, // Только 4 фиксированных курса
    students: Array.isArray(users) 
      ? users.filter((u) => u && typeof u === 'object' && 'is_active' in u && u.is_active).length 
      : 0,
    pendingSubmissions: Array.isArray(submissions) ? submissions.length : 0,
    avgCompletion: analytics?.averageCompletionRate || 0,
  };

  if (loading) {
    return <LoadingState message="Загрузка статистики..." />;
  }

  if (coursesError) {
    return (
      <ErrorState 
        error={coursesError} 
        title="Ошибка загрузки данных"
        onRetry={refetchCourses}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-300 text-sm">
            Обзор системы и статистика платформы
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm mb-1">Курсы</p>
              <p className="text-3xl font-bold text-white">{stats.courses}</p>
              <p className="text-gray-400 text-xs mt-1">Всего в системе</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BookOpen className="text-blue-500" size={32} />
            </div>
          </div>
          <Link to="/admin/courses" className="mt-4 inline-flex items-center text-blue-400 hover:text-blue-300 text-sm">
            Управление курсами <ArrowRight className="ml-1" size={14} />
          </Link>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm mb-1">Студенты</p>
              <p className="text-3xl font-bold text-white">{stats.students || '—'}</p>
              <p className="text-gray-400 text-xs mt-1">Активных пользователей</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Users className="text-green-500" size={32} />
            </div>
          </div>
          <Link to="/admin/users" className="mt-4 inline-flex items-center text-green-400 hover:text-green-300 text-sm">
            Управление пользователями <ArrowRight className="ml-1" size={14} />
          </Link>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm mb-1">Задания на проверке</p>
              <p className="text-3xl font-bold text-white">{stats.pendingSubmissions}</p>
              <p className="text-gray-400 text-xs mt-1">Требуют внимания</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <ClipboardCheck className="text-orange-500" size={32} />
            </div>
          </div>
          <Link to="/admin/assignments" className="mt-4 inline-flex items-center text-orange-400 hover:text-orange-300 text-sm">
            Проверить задания <ArrowRight className="ml-1" size={14} />
          </Link>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm mb-1">Среднее завершение</p>
              <p className="text-3xl font-bold text-white">
                {stats.avgCompletion ? `${Math.round(stats.avgCompletion)}%` : '—'}
              </p>
              <p className="text-gray-400 text-xs mt-1">Процент завершения</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-500" size={32} />
            </div>
          </div>
          <Link to="/admin/analytics" className="mt-4 inline-flex items-center text-purple-400 hover:text-purple-300 text-sm">
            Подробная аналитика <ArrowRight className="ml-1" size={14} />
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/courses?action=create">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
              <BookOpen className="mr-2" size={18} />
              Создать новый курс
            </Button>
          </Link>
          <Link to="/admin/assignments">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 justify-start">
              <ClipboardCheck className="mr-2" size={18} />
              Проверить задания
            </Button>
          </Link>
          <Link to="/admin/graph">
            <Button className="w-full bg-green-600 hover:bg-green-700 justify-start">
              <TrendingUp className="mr-2" size={18} />
              Редактировать граф
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-bold mb-4">Недавняя активность</h2>
        <div className="space-y-4">
          {courses.length > 0 ? (
            courses.slice(0, 5).map((course: any) => (
              <div key={course.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p className="font-medium">Курс: {course.title}</p>
                  <p className="text-gray-300 text-sm">
                    {course.status === 'published' ? 'Опубликован' : 'Черновик'} • 
                    {course.created_at && ` Создан ${new Date(course.created_at).toLocaleDateString('ru-RU')}`}
                  </p>
                </div>
                <Link to={`/admin/courses/${course.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Открыть
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300">Нет недавней активности</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
