import { useMemo, useState } from 'react';
import { CourseCard } from './CourseCard';
import { TrackFilter } from './TrackFilter';
import { courses } from '../data/mockData';
import { TrackId } from '../types';

interface CourseCatalogProps {
  onCourseSelect?: (courseId: string) => void;
  selectedTrack?: TrackId | 'all';
  onSelectedTrackChange?: (trackId: TrackId | 'all') => void;
}

export function CourseCatalog({ onCourseSelect, selectedTrack, onSelectedTrackChange }: CourseCatalogProps) {
  const [internalSelectedTrack, setInternalSelectedTrack] = useState<TrackId | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const effectiveSelectedTrack = selectedTrack ?? internalSelectedTrack;
  const setTrack = (trackId: TrackId | 'all') => {
    onSelectedTrackChange?.(trackId);
    if (!onSelectedTrackChange) setInternalSelectedTrack(trackId);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const trackMatch = effectiveSelectedTrack === 'all' || course.trackId === effectiveSelectedTrack;
      const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
      const statusMatch = selectedStatus === 'all' || course.status === selectedStatus;
      
      return trackMatch && levelMatch && statusMatch;
    });
  }, [effectiveSelectedTrack, selectedLevel, selectedStatus]);

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
    </section>
  );
}