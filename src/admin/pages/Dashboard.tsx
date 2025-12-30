import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, Users, ClipboardCheck, TrendingUp } from 'lucide-react';
import { adminAPI, checkServerHealth } from '@/api/adminClient';
import { toast } from 'sonner';

export function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    pendingSubmissions: 0,
    avgCompletion: 0,
  });

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      // Проверяем доступность сервера
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        toast.error('Сервер недоступен. Проверьте, что backend запущен на http://localhost:8000');
        return;
      }

      // Загружаем курсы и submissions параллельно
      const [courses, submissions] = await Promise.all([
        adminAPI.courses.getAll().catch(() => []),
        adminAPI.submissions.getAll('pending').catch(() => []),
      ]);
      
      // Подсчитываем статистику
      const coursesCount = Array.isArray(courses) ? courses.length : 0;
      const pendingCount = Array.isArray(submissions) ? submissions.length : 0;
      
      // Получаем статистику пользователей и аналитику
      try {
        const [users, analytics] = await Promise.all([
          adminAPI.users.getAll().catch(() => []),
          adminAPI.analytics.get('all').catch(() => null),
        ]);
        
        const usersCount = Array.isArray(users) ? users.length : 0;
        const activeUsersCount = Array.isArray(users) 
          ? users.filter((u: any) => u.is_active).length 
          : 0;
        
        const avgCompletion = analytics?.averageCompletionRate || 0;
        
        setStats({
          courses: coursesCount,
          students: activeUsersCount || usersCount,
          pendingSubmissions: pendingCount,
          avgCompletion: avgCompletion,
        });
      } catch (error) {
        // Fallback если не удалось получить данные
        setStats({
          courses: coursesCount,
          students: 0,
          pendingSubmissions: pendingCount,
          avgCompletion: 0,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast.error(error.message || 'Ошибка загрузки статистики');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Курсы</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.courses}</p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Студенты</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.students || '—'}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Задания на проверке</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.pendingSubmissions}</p>
            </div>
            <ClipboardCheck className="text-orange-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ср. завершение</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.avgCompletion ? `${stats.avgCompletion}%` : '—'}</p>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Недавняя активность</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div>
              <p className="text-white font-medium">Новый курс создан</p>
              <p className="text-gray-400 text-sm">«React Advanced» добавлен в систему</p>
            </div>
            <span className="text-gray-400 text-sm">2 часа назад</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div>
              <p className="text-white font-medium">Задание проверено</p>
              <p className="text-gray-400 text-sm">15 submissions проверено</p>
            </div>
            <span className="text-gray-400 text-sm">4 часа назад</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
