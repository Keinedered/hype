import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  averageCompletionRate: number;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    enrolledUsers: number;
    completedUsers: number;
    averageProgress: number;
  }>;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.analytics.get(timeRange);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(error.message || 'Ошибка загрузки аналитики');
      // Fallback data
      setAnalytics({
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        completedSubmissions: 0,
        averageCompletionRate: 0,
        courseProgress: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Загрузка аналитики...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Данные недоступны</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Аналитика</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="bg-gray-900 border-gray-800 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            <SelectItem value="all">Все время</SelectItem>
            <SelectItem value="month">Последний месяц</SelectItem>
            <SelectItem value="week">Последняя неделя</SelectItem>
            <SelectItem value="day">Сегодня</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего пользователей</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalUsers}</p>
              <p className="text-gray-500 text-xs mt-1">
                Активных: {analytics.activeUsers}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Курсы</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalCourses}</p>
              <p className="text-gray-500 text-xs mt-1">
                Опубликовано: {analytics.publishedCourses}
              </p>
            </div>
            <BookOpen className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Задания</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.totalSubmissions}</p>
              <p className="text-gray-500 text-xs mt-1">
                На проверке: {analytics.pendingSubmissions}
              </p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Средний прогресс</p>
              <p className="text-3xl font-bold text-white mt-2">
                {analytics.averageCompletionRate.toFixed(1)}%
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Завершено: {analytics.completedSubmissions}
              </p>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Course Progress */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Прогресс по курсам</h2>
        {analytics.courseProgress.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Нет данных о прогрессе</p>
        ) : (
          <div className="space-y-4">
            {analytics.courseProgress.map((course) => (
              <div key={course.courseId} className="border-b border-gray-800 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{course.courseTitle}</h3>
                    <p className="text-gray-400 text-sm">
                      Записано: {course.enrolledUsers} | Завершено: {course.completedUsers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {course.averageProgress.toFixed(1)}%
                    </p>
                    <p className="text-gray-400 text-xs">Средний прогресс</p>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${course.averageProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

