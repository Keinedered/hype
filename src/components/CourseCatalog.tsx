import { useEffect, useMemo, useState } from 'react';
import { CourseCard } from './CourseCard';
import { TrackFilter } from './TrackFilter';
import { coursesAPI, tracksAPI } from '../api/client';
import { normalizeCourse, normalizeTrack, RawCourse, RawTrack } from '../api/normalizers';
import { Course, Track, TrackId } from '../types';
import { Skeleton } from './ui/skeleton';

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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveSelectedTrack = selectedTrack ?? internalSelectedTrack;
  const setTrack = (trackId: TrackId | 'all') => {
    onSelectedTrackChange?.(trackId);
    if (!onSelectedTrackChange) setInternalSelectedTrack(trackId);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [rawCourses, rawTracks] = await Promise.all([
          coursesAPI.getAll(),
          tracksAPI.getAll(),
        ]);
        if (!isMounted) return;
        setCourses((rawCourses as RawCourse[]).map(normalizeCourse));
        setTracks((rawTracks as RawTrack[]).map(normalizeTrack));
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : '?? ??????? ????????? ?????');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const trackMatch = effectiveSelectedTrack === 'all' || course.trackId === effectiveSelectedTrack;
      const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
      const statusValue = course.status ?? 'not_started';
      const statusMatch = selectedStatus === 'all' || statusValue === selectedStatus;
      return trackMatch && levelMatch && statusMatch;
    });
  }, [courses, effectiveSelectedTrack, selectedLevel, selectedStatus]);

  const trackLookup = useMemo(() => {
    return tracks.reduce<Record<string, Track>>((acc, track) => {
      acc[track.id] = track;
      return acc;
    }, {});
  }, [tracks]);

  return (
    <section className="container mx-auto px-6 py-12 space-y-8 relative z-10">
      {/* Subtle decorative line */}
      <div className="absolute top-0 left-0 w-full h-px bg-black opacity-5" />
      
      <TrackFilter
        tracks={tracks}
        selectedTrack={effectiveSelectedTrack}
        onTrackChange={setTrack}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-2 border-black bg-white p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="border-2 border-black bg-white p-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-mono text-xs tracking-widest">
            ???????? ? ???????
          </div>
          <p className="font-mono text-sm text-muted-foreground">{error}</p>
          <p className="font-mono text-xs text-muted-foreground">?????????? ???????? ???????? ??? ????? ?????.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                track={trackLookup[course.trackId]}
                onSelect={onCourseSelect}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-20 border-2 border-black">
              <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                ?? ???????
              </div>
              <p className="text-muted-foreground font-mono">
                ????? ? ?????????? ????????? ?? ???????.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
