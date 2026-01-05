import { useMemo, useState, useEffect } from 'react';
import { CourseCard } from './CourseCard';
import { TrackFilter } from './TrackFilter';
import { Course, TrackId } from '../types';
import { coursesAPI } from '../api/client';
import { transformCourseFromAPI, ApiCourse } from '../utils/apiTransformers';

interface CourseCatalogProps {
  onCourseSelect?: (courseId: string) => void;
  selectedTrack?: TrackId | 'all';
  onSelectedTrackChange?: (trackId: TrackId | 'all') => void;
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
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch courses:', err);
        }
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки курсов';
        setError(errorMessage);
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
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin rounded-full" />
            <p className="text-muted-foreground font-mono">Загрузка курсов...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20 border-2 border-black bg-white p-6 max-w-2xl mx-auto">
          <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
            ОШИБКА
          </div>
          <p className="text-foreground font-mono mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchCourses();
            }}
            className="border-2 border-black px-4 py-2 font-mono text-sm hover:bg-black hover:text-white transition-colors"
          >
            Попробовать снова
          </button>
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