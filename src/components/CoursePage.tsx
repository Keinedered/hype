import { useEffect, useMemo, useState } from 'react';
import { Course, Lesson, Module, Track } from '../types';
import { coursesAPI, lessonsAPI, modulesAPI, tracksAPI } from '../api/client';
import { normalizeCourse, normalizeLesson, normalizeModule, normalizeTrack, RawCourse, RawLesson, RawModule, RawTrack } from '../api/normalizers';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ArrowLeft, BookOpen, MapPin, CheckCircle2, Circle, Play } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface CoursePageProps {
  courseId: string;
  onBack?: () => void;
  onStartCourse?: () => void;
  onOpenMap?: () => void;
  onSelectLesson?: (lessonId: string) => void;
  onOpenHandbook?: () => void;
}

export function CoursePage({ 
  courseId,
  onBack, 
  onStartCourse,
  onOpenMap,
  onSelectLesson,
  onOpenHandbook
}: CoursePageProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const rawCourse = (await coursesAPI.getById(courseId)) as RawCourse;
        const normalizedCourse = normalizeCourse(rawCourse);

        const [rawTrack, rawModules] = await Promise.all([
          tracksAPI.getById(normalizedCourse.trackId),
          modulesAPI.getByCourseId(courseId),
        ]);

        const normalizedTrack = normalizeTrack(rawTrack as RawTrack);
        const rawModulesList = (rawModules as RawModule[]) ?? [];
        const normalizedModules = rawModulesList.map(normalizeModule);

        const extractLessons = (value: unknown): RawLesson[] => {
          if (Array.isArray(value)) return value as RawLesson[];
          if (value && typeof value === 'object') {
            const record = value as { lessons?: unknown; items?: unknown };
            if (Array.isArray(record.lessons)) return record.lessons as RawLesson[];
            if (Array.isArray(record.items)) return record.items as RawLesson[];
          }
          return [];
        };

        const lessonsByModule = await Promise.all(
          normalizedModules.map(async (module, index) => {
            let lessons: Lesson[] = [];
            try {
              const rawLessons = await lessonsAPI.getByModuleId(module.id);
              lessons = extractLessons(rawLessons).map(normalizeLesson);
            } catch {
              lessons = [];
            }

            if (lessons.length === 0) {
              const rawModule = rawModulesList[index];
              lessons = (rawModule?.lessons ?? []).map(normalizeLesson);
            }
            return {
              moduleId: module.id,
              lessons: lessons.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
            };
          })
        );

        const modulesWithLessons = normalizedModules.map((module) => {
          const lessons = lessonsByModule.find((entry) => entry.moduleId === module.id)?.lessons ?? [];
          return { ...module, lessons };
        });

        if (!isMounted) return;
        setCourse(normalizedCourse);
        setTrack(normalizedTrack);
        setModules(modulesWithLessons);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить курс');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => {
      const aIndex = a.orderIndex ?? 0;
      const bIndex = b.orderIndex ?? 0;
      return aIndex - bIndex;
    });
  }, [modules]);

  const firstLessonId = useMemo(() => {
    for (const module of sortedModules) {
      if (module.lessons.length > 0) return module.lessons[0].id;
    }
    return null;
  }, [sortedModules]);

  const handleStart = () => {
    if (firstLessonId) {
      onSelectLesson?.(firstLessonId);
    } else {
      onStartCourse?.();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-6 py-16 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-6 py-16">
          <div className="border-2 border-black bg-white p-8 text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-mono text-xs tracking-widest">
              ПРОБЛЕМА С ДАННЫМИ
            </div>
            <p className="font-mono text-sm text-muted-foreground">{error ?? 'Курс не найден.'}</p>
            <p className="font-mono text-xs text-muted-foreground">Попробуйте обновить страницу или открыть другой курс.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b-2 border-black bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 relative">
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-black opacity-10" />
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-4 border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            НАЗАД К КАТАЛОГУ
          </Button>
        </div>
      </div>

      {/* Course header section */}
      <section 
        className="border-b-2 border-black relative bg-white/80 backdrop-blur-sm"
      >
            {/* Decorative graphic elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none overflow-hidden">
               {/* Grid pattern */}
               <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
               }} />
            </div>

            <div className="container mx-auto px-6 py-16 relative">
          <div className="max-w-4xl space-y-8">
            {/* Tags matching card style */}
            <div className="flex flex-wrap gap-2 items-start">
              <span className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full bg-white">
                {course.level === 'beginner' ? 'НАЧАЛЬНЫЙ' : course.level === 'intermediate' ? 'СРЕДНИЙ' : 'ПРОДВИНУТЫЙ'}
              </span>
              <span 
                className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full"
                style={{ backgroundColor: track?.color }}
              >
                {track?.name ? track.name.toUpperCase() : 'ТРЕК'}
              </span>
              <span className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full bg-transparent">
                 {course.version}
              </span>
            </div>

            <div className="relative inline-block">
              <div className="bg-black px-6 py-4 inline-block">
                <h1 className="text-white font-mono tracking-wide uppercase mb-0">
                  {course.title}
                </h1>
              </div>
              <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
            </div>
            
            <div className="border-l-4 border-black pl-6">
              <p className="text-foreground max-w-2xl font-mono leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course stats: на узких экранах в два ряда, без съезда */}
            <div className="flex flex-wrap gap-4 sm:gap-8 border-y-2 border-black py-4 items-center justify-center sm:justify-start">
              <div className="flex items-center gap-3 font-mono text-sm sm:text-base">
                <BookOpen className="w-5 h-5 shrink-0" />
                <span>{course.moduleCount} МОДУЛЕЙ</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-black" />
              <div className="flex items-center gap-3 font-mono text-sm sm:text-base">
                <Play className="w-5 h-5 shrink-0" />
                <span>{course.lessonCount} ВИДЕОЛЕКЦИЙ</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-black" />
              <div className="flex items-center gap-3 font-mono text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{course.taskCount} ЗАДАЧ</span>
              </div>
            </div>

            {/* Progress */}
            {course.progress !== undefined && (
              <div className="space-y-3 bg-white border-2 border-black p-6">
                <div className="flex justify-between font-mono">
                  <span>ВАШ ПРОГРЕСС</span>
                  <span style={{ color: '#000000' }} className="font-bold">{course.progress}%</span>
                </div>
                <div className="relative h-3 bg-white border-2 border-black">
                  <div 
                    className="absolute top-0 left-0 h-full transition-all"
                    style={{ 
                      backgroundColor: '#000000',
                      width: `${course.progress}%`
                    }}
                  />
                  {/* Decorative tick marks on progress bar */}
                  <div className="absolute top-0 left-1/4 h-full w-px bg-white opacity-20" />
                  <div className="absolute top-0 left-1/2 h-full w-px bg-white opacity-20" />
                  <div className="absolute top-0 left-3/4 h-full w-px bg-white opacity-20" />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button 
                size="lg"
                onClick={handleStart}
                disabled={!firstLessonId}
                className="border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-mono tracking-wide transition-all"
                style={{ backgroundColor: track?.color, color: '#000000' }}
              >
                {course.status === 'in_progress' ? 'ПРОДОЛЖИТЬ ОБУЧЕНИЕ' : 'НАЧАТЬ ОБУЧЕНИЕ'}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={onOpenMap}
                className="border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide transition-all"
              >
                <MapPin className="w-4 h-4 mr-2" />
                ОТКРЫТЬ КАРТУ
              </Button>
            </div>

            {/* Authors */}
            <div className="pt-6 border-t-2 border-black">
              <div className="bg-black text-white px-3 py-1 inline-block mb-3 font-mono text-sm tracking-wide">
                АВТОРЫ КУРСА
              </div>
              <div className="flex items-center gap-3 font-mono">
                {course.authors.map((author, index) => (
                  <div key={author} className="flex items-center gap-3">
                    <span>{author}</span>
                    {index < course.authors.length - 1 && (
                      <div className="w-px h-4 bg-black opacity-30" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Modules */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
              <h2 className="mb-0">СТРУКТУРА КУРСА</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {sortedModules.map((module, index) => (
                <AccordionItem 
                  key={module.id} 
                  value={module.id}
                  className="border-2 border-black bg-white"
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-start gap-4 text-left flex-1">
                      <div 
                        className="w-10 h-10 border-2 border-black flex items-center justify-center font-mono font-bold shrink-0"
                        style={{ backgroundColor: track?.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-mono tracking-wide mb-2">{module.title.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {module.description}
                        </div>
                        {module.progress !== undefined && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="relative h-2 flex-1 bg-white border border-black">
                              <div 
                                className="absolute top-0 left-0 h-full transition-all"
                                style={{ 
                                  backgroundColor: '#000000',
                                  width: `${module.progress}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold">
                              {module.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-2 border-t-2 border-black pt-4">
                      {module.lessons.length === 0 && (
                        <div className="text-sm font-mono text-muted-foreground">
                          В этом модуле пока нет уроков.
                        </div>
                      )}
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson?.(lesson.id)}
                          className="w-full flex items-center gap-4 p-4 border-2 border-black hover:bg-black hover:text-white transition-all text-left font-mono"
                        >
                          {lesson.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: track?.color }} />
                          ) : lesson.status === 'in_progress' ? (
                            <Circle className="w-5 h-5" style={{ color: track?.color, fill: track?.color }} />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                          <span className="text-sm tracking-wide">{lesson.title.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Right column - About */}
          <div className="space-y-6">
            <Card className="p-6 space-y-5 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block font-mono text-sm tracking-wide">
                О КУРСЕ
              </div>
              <div className="space-y-4 text-sm font-mono leading-relaxed">
                <p>
                  {course.description}
                </p>
                <div className="border-l-2 border-black pl-3">
                  <div className="font-bold text-foreground mb-2 tracking-wide">УРОВЕНЬ</div>
                  <p className="text-muted-foreground">
                    {course.level === 'beginner' ? 'Начальный' : course.level === 'intermediate' ? 'Средний' : 'Продвинутый'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block font-mono text-sm tracking-wide">
                ХЕНДБУК КУРСА
              </div>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Дополнительные материалы, шаблоны и чек-листы по темам курса
              </p>
              <Button 
                variant="outline" 
                onClick={onOpenHandbook}
                className="w-full border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide transition-all"
              >
                ОТКРЫТЬ ХЕНДБУК
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
