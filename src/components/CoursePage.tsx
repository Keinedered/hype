import { Course, Module } from '../types';
import { tracks, modules } from '../data/mockData';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ArrowLeft, BookOpen, MapPin, CheckCircle2, Circle, Play } from 'lucide-react';

interface CoursePageProps {
  course: Course;
  onBack?: () => void;
  onStartCourse?: () => void;
  onOpenMap?: () => void;
  onSelectLesson?: (lessonId: string) => void;
}

export function CoursePage({ 
  course, 
  onBack, 
  onStartCourse,
  onOpenMap,
  onSelectLesson 
}: CoursePageProps) {
  const track = tracks.find((t) => t.id === course.trackId);
  const courseModules = modules.filter((m) => m.courseId === course.id);

  // Mock lessons for display
  const mockLessons = (moduleId: string, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${moduleId}-lesson-${i + 1}`,
      title: `Урок ${i + 1}`,
      status: i === 0 ? 'completed' : i === 1 ? 'in_progress' : 'not_started'
    }));
  };

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
                {track?.name.toUpperCase()}
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

            {/* Course stats */}
            <div className="flex flex-wrap gap-8 border-y-2 border-black py-4">
              <div className="flex items-center gap-3 font-mono">
                <BookOpen className="w-5 h-5" />
                <span>{course.moduleCount} МОДУЛЕЙ</span>
              </div>
              <div className="w-px h-6 bg-black" />
              <div className="flex items-center gap-3 font-mono">
                <Play className="w-5 h-5" />
                <span>{course.lessonCount} ВИДЕОЛЕКЦИЙ</span>
              </div>
              <div className="w-px h-6 bg-black" />
              <div className="flex items-center gap-3 font-mono">
                <CheckCircle2 className="w-5 h-5" />
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
                onClick={onStartCourse}
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
              {courseModules.map((module, index) => (
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
                      {mockLessons(module.id, 3).map((lesson, lessonIndex) => (
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
                  Этот курс познакомит вас с основами продуктового менеджмента 
                  и даст необходимые инструменты для работы с цифровыми продуктами.
                </p>
                <div className="border-l-2 border-black pl-3">
                  <div className="font-bold text-foreground mb-2 tracking-wide">ДЛЯ КОГО ЭТОТ КУРС</div>
                  <p className="text-muted-foreground">
                    Начинающие продакт-менеджеры, стажёры, специалисты смежных областей
                  </p>
                </div>
                <div className="border-l-2 border-black pl-3">
                  <div className="font-bold text-foreground mb-2 tracking-wide">ЧТО ВЫ ПОЛУЧИТЕ</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>→ Понимание роли продакта</li>
                    <li>→ Навыки проведения исследований</li>
                    <li>→ Умение ставить метрики</li>
                    <li>→ Опыт запуска продукта</li>
                  </ul>
                </div>
                <div className="border-l-2 border-black pl-3">
                  <div className="font-bold text-foreground mb-2 tracking-wide">УРОВЕНЬ</div>
                  <p className="text-muted-foreground">Начальный</p>
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
              <Button variant="outline" className="w-full border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide transition-all">
                ОТКРЫТЬ ХЕНДБУК
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}