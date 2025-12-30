import { useMemo, useState, useEffect } from 'react';
import { CourseCard } from './CourseCard';
import { TrackFilter } from './TrackFilter';
import { Course, TrackId } from '../types';
import { coursesAPI } from '../api/client';

interface CourseCatalogProps {
  onCourseSelect?: (courseId: string) => void;
  selectedTrack?: TrackId | 'all';
  onSelectedTrackChange?: (trackId: TrackId | 'all') => void;
}

// Преобразование данных из API в формат фронтенда
function transformCourseFromAPI(apiCourse: any): Course {
  return {
    id: apiCourse.id,
    trackId: apiCourse.track_id as TrackId,
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

export function CourseCatalog({ onCourseSelect, selectedTrack, onSelectedTrackChange }: CourseCatalogProps) {
  const [internalSelectedTrack, setInternalSelectedTrack] = useState<TrackId | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveSelectedTrack = selectedTrack ?? internalSelectedTrack;
  const setTrack = (trackId: TrackId | 'all') => {
    onSelectedTrackChange?.(trackId);
    if (!onSelectedTrackChange) setInternalSelectedTrack(trackId);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const trackId = effectiveSelectedTrack !== 'all' ? effectiveSelectedTrack : undefined;
        const apiCourses = await coursesAPI.getAll(trackId);
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
  }, [effectiveSelectedTrack]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const trackMatch = effectiveSelectedTrack === 'all' || course.trackId === effectiveSelectedTrack;
      const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
      const statusMatch = selectedStatus === 'all' || (course.status ?? 'not_started') === selectedStatus;
      return trackMatch && levelMatch && statusMatch;
    });
  }, [courses, effectiveSelectedTrack, selectedLevel, selectedStatus]);

  return (
    <section className="container mx-auto px-6 py-12 space-y-8 relative z-10">
      {/* Subtle decorative line */}
      <div className="absolute top-0 left-0 w-full h-px bg-black opacity-5" />
      
      <TrackFilter
        selectedTrack={effectiveSelectedTrack}
        onTrackChange={setTrack}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                onSelect={onCourseSelect}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-20 border-2 border-black">
              <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                НЕ НАЙДЕНО
              </div>
              <p className="text-muted-foreground font-mono">
                Курсы с выбранными фильтрами не найдены
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}