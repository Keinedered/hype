import { useEffect, useMemo, useState } from 'react';
import { coursesAPI, tracksAPI } from '../api/client';
import { Course, Track, TrackId } from '../types';
import { CourseCard } from './CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';

interface MyCoursesPageProps {
  onCourseSelect?: (courseId: string) => void;
}

type RawCourse = {
  id: string;
  track_id: TrackId;
  title: string;
  version: string;
  description: string;
  short_description: string;
  level: Course['level'];
  module_count: number;
  lesson_count: number;
  task_count: number;
  authors: string[];
  enrollment_deadline?: string | null;
  progress?: number | null;
  status?: Course['status'] | null;
};

const normalizeCourse = (raw: RawCourse): Course => ({
  id: raw.id,
  trackId: raw.track_id,
  title: raw.title,
  version: raw.version,
  description: raw.description,
  shortDescription: raw.short_description,
  level: raw.level,
  moduleCount: raw.module_count,
  lessonCount: raw.lesson_count,
  taskCount: raw.task_count,
  authors: raw.authors,
  enrollmentDeadline: raw.enrollment_deadline ?? undefined,
  progress: raw.progress ?? undefined,
  status: raw.status ?? undefined,
});

export function MyCoursesPage({ onCourseSelect }: MyCoursesPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<'progress' | 'title'>('progress');
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');

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
        setTracks(rawTracks as Track[]);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load courses');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const trackLookup = useMemo(() => {
    return tracks.reduce<Record<string, Track>>((acc, track) => {
      acc[track.id] = track;
      return acc;
    }, {});
  }, [tracks]);

  const enrolledCourses = useMemo(
    () => courses.filter((course) => course.status && course.status !== 'not_started'),
    [courses]
  );
  const inProgressCourses = useMemo(
    () => courses.filter((course) => course.status === 'in_progress'),
    [courses]
  );
  const completedCourses = useMemo(
    () => courses.filter((course) => course.status === 'completed'),
    [courses]
  );

  const averageProgress = useMemo(() => {
    const progressValues = enrolledCourses
      .map((course) => course.progress)
      .filter((value): value is number => typeof value === 'number');
    if (progressValues.length === 0) return 0;
    return Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length);
  }, [enrolledCourses]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byQuery = normalizedQuery.length
      ? enrolledCourses.filter((course) => {
          return (
            course.title.toLowerCase().includes(normalizedQuery) ||
            course.shortDescription.toLowerCase().includes(normalizedQuery)
          );
        })
      : enrolledCourses;

    const sorted = [...byQuery].sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title);
      }
      const aProgress = a.progress ?? 0;
      const bProgress = b.progress ?? 0;
      return bProgress - aProgress;
    });

    return sorted;
  }, [enrolledCourses, query, sortKey]);

  const filteredInProgress = useMemo(
    () => filteredCourses.filter((course) => course.status === 'in_progress'),
    [filteredCourses]
  );
  const filteredCompleted = useMemo(
    () => filteredCourses.filter((course) => course.status === 'completed'),
    [filteredCourses]
  );

  const renderCourseGrid = (list: Course[], emptyTitle: string, emptyBody: string) => {
    if (loading) {
      return (
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
      );
    }

    if (error) {
      return (
        <div className="border-2 border-black bg-white p-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-mono text-xs tracking-widest">
            DATA ISSUE
          </div>
          <p className="font-mono text-sm text-muted-foreground">{error}</p>
          <p className="font-mono text-xs text-muted-foreground">Try refreshing the page or logging in again.</p>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="text-center py-20 border-2 border-black bg-white">
          <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
            {emptyTitle}
          </div>
          <p className="text-muted-foreground font-mono">{emptyBody}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            track={trackLookup[course.trackId]}
            onSelect={onCourseSelect}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-6 py-12 space-y-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="relative inline-block">
              <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
                <h1 className="mb-0">MY COURSES</h1>
              </div>
              <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
            </div>

            <div className="border-l-4 border-black pl-6">
              <p className="text-muted-foreground font-mono leading-relaxed">
                A personalized learning dashboard with progress, focus, and quick access to active courses.
              </p>
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 space-y-3">
            <div className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Average progress</div>
            <div className="text-4xl font-mono font-bold">{averageProgress}%</div>
            <div className="h-1 border border-black/20 bg-gray-100">
              <div className="h-full bg-black transition-all" style={{ width: `${averageProgress}%` }} />
            </div>
            <div className="text-xs font-mono text-muted-foreground">Based on active courses</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="border-2 border-black bg-white p-4">
            <div className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Active total</div>
            <div className="text-3xl font-mono font-bold">{enrolledCourses.length}</div>
          </div>
          <div className="border-2 border-black bg-white p-4">
            <div className="text-xs font-mono tracking-widest uppercase text-muted-foreground">In progress</div>
            <div className="text-3xl font-mono font-bold">{inProgressCourses.length}</div>
          </div>
          <div className="border-2 border-black bg-white p-4">
            <div className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Completed</div>
            <div className="text-3xl font-mono font-bold">{completedCourses.length}</div>
          </div>
          <div className="border-2 border-black bg-white p-4">
            <div className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Today focus</div>
            <div className="text-sm font-mono">Resume something from the In Progress tab.</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-2 border-black bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Search</div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Course title or description"
              className="h-10 border-2 border-black font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Sort</div>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as 'progress' | 'title')}>
              <SelectTrigger className="h-10 border-2 border-black font-mono text-sm">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">By progress</SelectItem>
                <SelectItem value="title">By title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'in-progress' | 'completed')} className="space-y-8">
          <TabsList className="border-2 border-black bg-white p-1">
            <TabsTrigger 
              value="all" 
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              ALL ACTIVE ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="in-progress"
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              IN PROGRESS ({inProgressCourses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="font-mono tracking-wide data-[state=active]:bg-black data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-black"
            >
              COMPLETED ({completedCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {renderCourseGrid(
              filteredCourses,
              'NO ACTIVE COURSES',
              'You are not enrolled in any courses yet, or they are all completed.'
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            {renderCourseGrid(
              filteredInProgress,
              'NO COURSES IN PROGRESS',
              'Keep learning to see courses here.'
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {renderCourseGrid(
              filteredCompleted,
              'NO COMPLETED COURSES',
              'Completed courses will appear here.'
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
