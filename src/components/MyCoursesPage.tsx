import { useState, useEffect, useMemo } from 'react';
import { Course } from '../types';
import { CourseCard } from './CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { coursesAPI } from '../api/client';

interface MyCoursesPageProps {
  onCourseSelect?: (courseId: string) => void;
}

// Преобразование данных из API в формат фронтенда
function transformCourseFromAPI(apiCourse: any): Course {
  return {
    id: apiCourse.id,
    trackId: apiCourse.track_id,
    title: apiCourse.title,
    version: apiCourse.version || '1.0',
    description: apiCourse.description || '',
    shortDescription: apiCourse.short_description || '',
    level: apiCourse.level as 'beginner' | 'intermediate' | 'advanced',
    moduleCount: apiCourse.module_count || 0,
    lessonCount: apiCourse.lesson_count || 0,
    taskCount: apiCourse.task_count || 0,
    authors: apiCourse.authors || [],
    enrollmentDeadline: apiCourse.enrollment_deadline,
    progress: apiCourse.progress,
    status: apiCourse.status as 'not_started' | 'in_progress' | 'completed' | undefined,
  };
}

export function MyCoursesPage({ onCourseSelect }: MyCoursesPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiCourses = await coursesAPI.getAll();
        const transformedCourses = Array.isArray(apiCourses) 
          ? apiCourses.map(transformCourseFromAPI)
          : [];
        setCourses(transformedCourses);
      } catch (err: any) {
        console.error('Failed to fetch courses:', err);
        setError(err.message || 'Ошибка загрузки курсов');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const inProgressCourses = useMemo(() => courses.filter(c => c.status === 'in_progress'), [courses]);
  const completedCourses = useMemo(() => courses.filter(c => c.status === 'completed'), [courses]);
  const allEnrolledCourses = useMemo(() => courses.filter(c => c.status !== 'not_started'), [courses]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-6 py-12 space-y-8">
        <div className="relative inline-block">
          <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
            <h1 className="mb-0">МОИ КУРСЫ</h1>
          </div>
          <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
          <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
        </div>
        
        <div className="border-l-4 border-black pl-6">
          <p className="text-muted-foreground font-mono leading-relaxed">
            Отслеживайте свой прогресс и продолжайте обучение
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-mono">Загрузка курсов...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-2 border-black">
            <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
              ОШИБКА
            </div>
            <p className="text-muted-foreground font-mono">{error}</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="border-2 border-black bg-white p-1">
            <TabsTrigger 
              value="all" 
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              ВСЕ КУРСЫ ({allEnrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="in-progress"
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              В ПРОЦЕССЕ ({inProgressCourses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              ЗАВЕРШЁННЫЕ ({completedCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {allEnrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEnrolledCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                    onSelect={onCourseSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-black">
                <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                  НЕТ КУРСОВ
                </div>
                <p className="text-muted-foreground font-mono">
                  Вы пока не записаны ни на один курс
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            {inProgressCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                    onSelect={onCourseSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-black">
                <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                  НЕТ КУРСОВ
                </div>
                <p className="text-muted-foreground font-mono">
                  Нет курсов в процессе обучения
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                    onSelect={onCourseSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-black">
                <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                  НЕТ КУРСОВ
                </div>
                <p className="text-muted-foreground font-mono">
                  Нет завершённых курсов
                </p>
              </div>
            )}
          </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}