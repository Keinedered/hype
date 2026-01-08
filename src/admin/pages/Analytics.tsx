import { useState, useMemo } from 'react';
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
import { useApiQuery } from '../hooks';
import { LoadingState, ErrorState } from '../components';

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
  const [timeRange, setTimeRange] = useState('all');

  // Загрузка аналитики через useApiQuery
  // Используем useMemo для создания стабильной функции запроса
  const analyticsQuery = useMemo(
    () => () => adminAPI.analytics.get(timeRange),
    [timeRange]
  );
  
  const { data: analytics, loading, error, refetch } = useApiQuery(
    analyticsQuery,
    { 
      cacheTime: 1 * 60 * 1000, // 1 минута
    }
  );

  if (loading) {
    return <LoadingState message="Загрузка аналитики..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Ошибка загрузки аналитики" onRetry={refetch} />;
  }

  // Fallback данные если analytics null
  const analyticsData: AnalyticsData = analytics || {
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
    averageCompletionRate: 0,
    courseProgress: [],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="bg-gray-900 border-gray-800 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 shadow-lg">
            <SelectItem value="all" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Все время</SelectItem>
            <SelectItem value="month" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Последний месяц</SelectItem>
            <SelectItem value="week" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Последняя неделя</SelectItem>
            <SelectItem value="day" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Сегодня</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Всего пользователей</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.totalUsers}</p>
              <p className="text-gray-300 text-xs mt-1">
                Активных: {analyticsData.activeUsers}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Курсы</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.totalCourses}</p>
              <p className="text-gray-300 text-xs mt-1">
                Опубликовано: {analyticsData.publishedCourses}
              </p>
            </div>
            <BookOpen className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Задания</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.totalSubmissions}</p>
              <p className="text-gray-300 text-xs mt-1">
                На проверке: {analyticsData.pendingSubmissions}
              </p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Средний прогресс</p>
              <p className="text-3xl font-bold mt-2">
                {analyticsData.averageCompletionRate.toFixed(1)}%
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Завершено: {analyticsData.completedSubmissions}
              </p>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Course Progress */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-bold mb-4">Прогресс по курсам</h2>
        {analyticsData.courseProgress.length === 0 ? (
          <p className="text-gray-300 text-center py-8">Нет данных о прогрессе</p>
        ) : (
          <div className="space-y-4">
            {analyticsData.courseProgress.map((course) => (
              <div key={course.courseId} className="border-b border-gray-800 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{course.courseTitle}</h3>
                    <p className="text-gray-300 text-sm">
                      Записано: {course.enrolledUsers} | Завершено: {course.completedUsers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {course.averageProgress.toFixed(1)}%
                    </p>
                    <p className="text-gray-300 text-xs">Средний прогресс</p>
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

