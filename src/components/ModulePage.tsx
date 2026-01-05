import { useState, useEffect } from 'react';
import { Module, Lesson, Course, TrackId } from '../types';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { ArrowLeft, BookOpen, Play, CheckCircle2, Circle, Clock, FileText, MapPin, ChevronRight, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { modulesAPI, lessonsAPI as apiLessonsAPI, coursesAPI, tracksAPI as apiTracksAPI } from '../api/client';
import { transformModuleFromAPI, transformLessonFromAPI, transformCourseFromAPI, ApiModule, ApiLesson, ApiCourse } from '../utils/apiTransformers';

interface ModulePageProps {
  moduleId: string;
  onBack?: () => void;
  onSelectLesson?: (lessonId: string, moduleId?: string) => void;
  onOpenHandbook?: () => void;
  onOpenMap?: () => void;
}

export function ModulePage({ 
  moduleId, 
  onBack, 
  onSelectLesson,
  onOpenHandbook,
  onOpenMap
}: ModulePageProps) {
  const [module, setModule] = useState<Module | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<{ id: string; name: string; color: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем модуль
        const moduleData = await modulesAPI.getById(moduleId);
        if (!moduleData) {
          throw new Error('Module not found');
        }
        const transformedModule = transformModuleFromAPI(moduleData as ApiModule);
        setModule(transformedModule);

        // Загружаем курс
        if (transformedModule.courseId) {
          try {
            const courseData = await coursesAPI.getById(transformedModule.courseId);
            const transformedCourse = transformCourseFromAPI(courseData as ApiCourse);
            setCourse(transformedCourse);

            // Загружаем трек
            try {
              const tracksData = await apiTracksAPI.getAll();
              const foundTrack = Array.isArray(tracksData) 
                ? (tracksData as Array<{ id: string; name: string; color: string }>).find((t) => t.id === transformedCourse.trackId)
                : null;
              setTrack(foundTrack || null);
            } catch {
              setTrack(null);
            }
          } catch (err: unknown) {
            if (import.meta.env.DEV) {
              console.error('Failed to fetch course:', err);
            }
          }
        }

        // Загружаем уроки
        try {
          const lessonsData = await apiLessonsAPI.getByModuleId(moduleId);
          const transformedLessons = Array.isArray(lessonsData)
            ? lessonsData.map(transformLessonFromAPI)
            : [];
          setLessons(transformedLessons);
        } catch (err: unknown) {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch lessons:', err);
          }
          setLessons([]);
        }
      } catch (err: unknown) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch module data:', err);
        }
        setModule(null);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchData();
    }
  }, [moduleId]);

  const getLessonStatusIcon = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLessonStatusText = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'completed':
        return 'Завершено';
      case 'in_progress':
        return 'В процессе';
      default:
        return 'Не начато';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="inline-flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin rounded-full" />
          <p className="text-foreground font-mono">Загрузка модуля...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-foreground font-mono mb-4">Модуль не найден</p>
            {onBack && (
              <Button onClick={onBack} className="border-2 border-black hover:bg-black hover:text-white font-mono">
                <ArrowLeft className="w-4 h-4 mr-2" />
                НАЗАД
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === 'completed').length;
  const totalLessons = lessons.length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Находим текущий урок для кнопки "Продолжить"
  const currentLesson = lessons.find(l => l.status === 'in_progress') || 
    (lessons.length > 0 && lessons[0].status !== 'completed' ? lessons[0] : null);
  
  // Находим следующий урок
  const getNextLesson = () => {
    if (currentLesson) {
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      return lessons[currentIndex + 1] || null;
    }
    return lessons[0] || null;
  };
  const nextLesson = getNextLesson();

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b-2 border-black bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                НАЗАД
              </Button>
              
              <div className="h-6 w-px bg-black/20"></div>

              {course && (
                <>
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="font-mono text-sm hover:underline"
                  >
                    {course.title}
                  </Button>
                  <span className="text-black/40 font-mono">/</span>
                </>
              )}

              <div className="relative inline-block">
                <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
                  <h1 className="mb-0">{module.title.toUpperCase()}</h1>
                </div>
                <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
                <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {onOpenMap && (
                <Button 
                  variant="outline"
                  onClick={onOpenMap}
                  className="border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  КАРТА
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Module Header Section */}
            <section className="border-2 border-black bg-white/80 backdrop-blur-sm relative">
              {/* Decorative graphic elements */}
              <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }} />
              </div>

              <div className="p-8 relative">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 items-start mb-6">
                  {track && (
                    <span 
                      className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full"
                      style={{ backgroundColor: track.color }}
                    >
                      {track.name.toUpperCase()}
                    </span>
                  )}
                  {course && (
                    <span className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full bg-transparent">
                      {course.title.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Description */}
                {module.description && (
                  <div className="border-l-4 border-black pl-6 mb-6">
                    <p className="text-foreground max-w-2xl font-mono leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                )}

                {/* Module Stats */}
                <div className="flex flex-wrap gap-8 border-y-2 border-black py-4">
                  <div className="flex items-center gap-3 font-mono">
                    <Play className="w-5 h-5" />
                    <span>{totalLessons} УРОКОВ</span>
                  </div>
                  <div className="w-px h-6 bg-black" />
                  <div className="flex items-center gap-3 font-mono">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{completedLessons} ЗАВЕРШЕНО</span>
                  </div>
                </div>

                {/* Enhanced Progress */}
                {module.progress !== undefined && (
                  <div className="mt-6 space-y-4 bg-gradient-to-br from-gray-50 to-white border-2 border-black p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-mono font-bold text-sm uppercase tracking-wide">Прогресс модуля</span>
                      </div>
                      <span className="font-bold font-mono text-2xl" style={{ color: '#000000' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-white border-2 border-black overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full transition-all duration-500 ease-out"
                        style={{ 
                          background: progress === 100 
                            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(90deg, #000000 0%, #1a1a1a 100%)',
                          width: `${progress}%`,
                          boxShadow: progress > 0 ? 'inset 0 1px 2px rgba(255,255,255,0.2)' : 'none'
                        }}
                      />
                      {/* Milestone markers */}
                      {totalLessons > 1 && (
                        <>
                          <div className="absolute top-0 left-1/4 h-full w-px bg-black opacity-10" />
                          <div className="absolute top-0 left-1/2 h-full w-px bg-black opacity-10" />
                          <div className="absolute top-0 left-3/4 h-full w-px bg-black opacity-10" />
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-600 mt-2">
                      <span>{completedLessons} из {totalLessons} уроков завершено</span>
                      {progress === 100 && (
                        <span className="text-green-600 font-bold">✓ Модуль завершен!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Action - Continue Learning */}
            {currentLesson && (
              <section className="border-2 border-black bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-black opacity-5 rounded-full -mr-32 -mt-32" />
                <div className="p-6 relative">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-mono tracking-widest uppercase text-gray-600">Продолжить обучение</span>
                      </div>
                      <h3 className="font-bold font-mono text-lg mb-1 text-black">
                        {lessons.findIndex(l => l.id === currentLesson.id) + 1}. {currentLesson.title}
                      </h3>
                      {currentLesson.videoDuration && (
                        <p className="text-sm text-gray-600 font-mono">
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          {currentLesson.videoDuration} минут
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => onSelectLesson?.(currentLesson.id, module.id)}
                      className="bg-black text-white hover:bg-gray-800 border-2 border-black font-mono tracking-wide px-6 py-3 h-auto transition-all hover:scale-105"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Продолжить
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Lessons Section - Enhanced Design */}
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold font-mono tracking-wide mb-2">СОДЕРЖАНИЕ МОДУЛЯ</h2>
                  <p className="text-sm text-gray-600 font-mono">
                    {totalLessons} {totalLessons === 1 ? 'урок' : totalLessons < 5 ? 'урока' : 'уроков'} • {completedLessons} завершено
                  </p>
                </div>
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-white/50 p-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-foreground font-mono text-lg">Уроки не найдены</p>
                  <p className="text-gray-500 font-mono text-sm mt-2">Уроки появятся здесь после их добавления</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson, index) => {
                    const isCurrent = lesson.status === 'in_progress';
                    const isCompleted = lesson.status === 'completed';
                    const isUpcoming = !isCurrent && !isCompleted;
                    const previousLesson = index > 0 ? lessons[index - 1] : null;
                    const isLocked = isUpcoming && index > 0 && previousLesson && previousLesson.status !== 'completed';
                    const isFirst = index === 0;
                    const isLast = index === lessons.length - 1;
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`group relative border-2 transition-all duration-300 ${
                          isLocked 
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                            : isCurrent
                            ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                            : isCompleted
                            ? 'border-black bg-white cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                            : 'border-gray-400 bg-white cursor-pointer hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                        onClick={() => !isLocked && onSelectLesson?.(lesson.id, module.id)}
                      >
                        {/* Status indicator bar */}
                        {isCurrent && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse" />
                        )}
                        {isCompleted && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400" />
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Number and status indicator */}
                            <div className="flex flex-col items-center shrink-0">
                              <div 
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all ${
                                  isCompleted
                                    ? 'bg-black border-black text-white'
                                    : isCurrent
                                    ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                    : isLocked
                                    ? 'bg-gray-200 border-gray-400 text-gray-500'
                                    : 'bg-white border-gray-400 text-gray-700'
                                }`}
                              >
                                {isLocked ? (
                                  <Lock className="w-5 h-5" />
                                ) : isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              {/* Connecting line */}
                              {!isLast && (
                                <div 
                                  className={`w-0.5 flex-1 mt-2 transition-colors ${
                                    isCompleted ? 'bg-green-400' : isCurrent ? 'bg-yellow-400' : 'bg-gray-300'
                                  }`}
                                  style={{ minHeight: '20px' }}
                                />
                              )}
                            </div>
                            
                            {/* Lesson content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 
                                    className={`font-bold font-mono text-lg mb-2 leading-tight ${
                                      isLocked ? 'text-gray-400' : 'text-black'
                                    }`}
                                  >
                                    {lesson.title}
                                  </h3>
                                  
                                  {/* Status badge */}
                                  <div className="flex items-center gap-2 mb-3">
                                    {isCurrent && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-900 text-xs font-mono border border-yellow-500">
                                        <Clock className="w-3 h-3" />
                                        В процессе
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-900 text-xs font-mono border border-green-500">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Завершено
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono border border-gray-400">
                                        <Lock className="w-3 h-3" />
                                        Заблокировано
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Arrow icon */}
                                {!isLocked && (
                                  <ChevronRight 
                                    className={`w-5 h-5 shrink-0 transition-transform ${
                                      isCurrent || isCompleted ? 'text-black' : 'text-gray-400'
                                    } group-hover:translate-x-1`} 
                                  />
                                )}
                              </div>
                              
                              {/* Lesson metadata */}
                              <div className="flex items-center gap-4 text-sm text-gray-600 font-mono">
                                {lesson.videoDuration && (
                                  <div className="flex items-center gap-1">
                                    <Play className="w-3.5 h-3.5" />
                                    <span>{lesson.videoDuration} мин</span>
                                  </div>
                                )}
                                {isCompleted && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Завершено</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar - Handbook Button */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {onOpenHandbook && (
                <Card className="border-2 border-black bg-white">
                  <div className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div 
                        className="w-16 h-16 border-2 border-black flex items-center justify-center rounded-full"
                        style={{ backgroundColor: track?.color }}
                      >
                        <BookOpen className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h3 className="font-mono tracking-wide text-lg mb-2">
                          ХЕНДБУК
                        </h3>
                        <p className="text-sm text-gray-700 font-mono mb-4">
                          Справочные материалы и шаблоны для работы
                        </p>
                      </div>

                      <Button
                        onClick={onOpenHandbook}
                        className="w-full border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono tracking-wide transition-all"
                        style={{ backgroundColor: track?.color }}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        ОТКРЫТЬ ХЕНДБУК
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Enhanced Quick Stats */}
              <Card className="border-2 border-black bg-white">
                <div className="p-6">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4" />
                      <h3 className="font-mono tracking-wide text-sm uppercase font-bold">
                        Статистика
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-200">
                        <div className="flex justify-between items-center font-mono text-sm mb-1">
                          <span className="text-gray-600">Всего уроков</span>
                          <span className="font-bold text-lg">{totalLessons}</span>
                        </div>
                      </div>
                      
                      <div className="pb-3 border-b border-gray-200">
                        <div className="flex justify-between items-center font-mono text-sm mb-1">
                          <span className="text-gray-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Завершено
                          </span>
                          <span className="font-bold text-lg text-green-600">{completedLessons}</span>
                        </div>
                        {totalLessons > 0 && (
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {Math.round((completedLessons / totalLessons) * 100)}% от общего
                          </div>
                        )}
                      </div>
                      
                      <div className="pb-3 border-b border-gray-200">
                        <div className="flex justify-between items-center font-mono text-sm mb-1">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            В процессе
                          </span>
                          <span className="font-bold text-lg text-yellow-600">
                            {lessons.filter(l => l.status === 'in_progress').length}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center font-mono text-sm mb-1">
                          <span className="text-gray-600">Не начато</span>
                          <span className="font-bold text-lg text-gray-400">
                            {lessons.filter(l => !l.status || l.status === 'not_started').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Next lesson preview */}
                    {nextLesson && !currentLesson && (
                      <div className="mt-6 pt-6 border-t-2 border-black">
                        <p className="text-xs font-mono uppercase tracking-wide text-gray-600 mb-2">
                          Следующий урок
                        </p>
                        <button
                          onClick={() => onSelectLesson?.(nextLesson.id, module.id)}
                          className="text-left w-full group"
                        >
                          <p className="font-mono font-bold text-sm group-hover:underline">
                            {lessons.findIndex(l => l.id === nextLesson.id) + 1}. {nextLesson.title}
                          </p>
                          {nextLesson.videoDuration && (
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              <Play className="w-3 h-3 inline mr-1" />
                              {nextLesson.videoDuration} мин
                            </p>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

