import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Upload, Link as LinkIcon, Check, Clock, X, Circle, FileText } from 'lucide-react';
import { TrackId, Lesson, Module, Track } from '../types';
import { coursesAPI, lessonsAPI, modulesAPI, submissionsAPI, tracksAPI } from '../api/client';
import { normalizeCourse, normalizeLesson, normalizeModule, normalizeTrack, RawCourse, RawLesson, RawModule, RawTrack } from '../api/normalizers';
import { Skeleton } from './ui/skeleton';

interface LessonPageProps {
  onBack?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onOpenMap?: () => void;
  onGoToCatalog?: (trackId?: TrackId | 'all') => void;
  onOpenHandbook?: () => void;
  lessonId?: string;
}

export function LessonPage({ onBack, onNavigate, onOpenMap, onGoToCatalog, onOpenHandbook, lessonId }: LessonPageProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [textAnswer, setTextAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'not_submitted' | 'pending' | 'accepted' | 'needs_revision'>('not_submitted');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!lessonId) {
        setError('Урок не выбран.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const rawLesson = (await lessonsAPI.getById(lessonId)) as RawLesson;
        const normalizedLesson = normalizeLesson(rawLesson);

        const rawModule = (await modulesAPI.getById(normalizedLesson.moduleId)) as RawModule;
        const normalizedModule = normalizeModule(rawModule);

        const rawCourse = (await coursesAPI.getById(normalizedModule.courseId)) as RawCourse;
        const normalizedCourse = normalizeCourse(rawCourse);

        const [rawTrack, rawModuleLessons] = await Promise.all([
          tracksAPI.getById(normalizedCourse.trackId),
          lessonsAPI.getByModuleId(normalizedModule.id),
        ]);

        const normalizedTrack = normalizeTrack(rawTrack as RawTrack);
        const normalizedModuleLessons = (rawModuleLessons as RawLesson[])
          .map(normalizeLesson)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        if (!isMounted) return;
        setLesson(normalizedLesson);
        setModule(normalizedModule);
        setTrack(normalizedTrack);
        setModuleLessons(normalizedModuleLessons);
        setTextAnswer('');
        setLinkUrl('');
        setSubmissionStatus('not_submitted');
        setSubmissionError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить урок');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const lessonIndex = useMemo(() => {
    if (!lesson) return -1;
    return moduleLessons.findIndex((item) => item.id === lesson.id);
  }, [lesson, moduleLessons]);

  const prevLesson = lessonIndex > 0 ? moduleLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < moduleLessons.length - 1 ? moduleLessons[lessonIndex + 1] : null;

  const canSubmit = useMemo(() => {
    if (!lesson?.assignment) return false;
    if (lesson.assignment.requiresFile) return false;
    if (lesson.assignment.requiresText && !textAnswer.trim()) return false;
    if (lesson.assignment.requiresLink && !linkUrl.trim()) return false;
    return true;
  }, [lesson, linkUrl, textAnswer]);

  const handleSubmit = async () => {
    if (!lesson?.assignment) return;
    try {
      setSubmissionError(null);
      setSubmissionStatus('pending');
      const response = await submissionsAPI.create({
        assignment_id: lesson.assignment.id,
        text_answer: textAnswer.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
        file_urls: [],
      });
      const status = (response as { status?: string }).status as typeof submissionStatus | undefined;
      setSubmissionStatus(status ?? 'pending');
    } catch (err) {
      setSubmissionStatus('not_submitted');
      setSubmissionError(err instanceof Error ? err.message : 'Не удалось отправить задание');
    }
  };

  const getStatusBadge = () => {
    switch (submissionStatus) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#f0f0f0] border border-black/10">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">На проверке</span>
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#B6E2C8] border border-black">
            <Check className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">Принято</span>
          </div>
        );
      case 'needs_revision':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#E2B6C8] border border-black">
            <X className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">Нужна доработка</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 border border-black text-black/50">
            <Circle className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">Не отправлено</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-black font-sans">
        <div className="container mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-transparent text-black font-sans">
        <div className="container mx-auto px-6 py-12">
          <div className="border-2 border-black bg-white p-8 text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-mono text-xs tracking-widest">
              ПРОБЛЕМА С ДАННЫМИ
            </div>
            <p className="font-mono text-sm text-muted-foreground">{error ?? 'Урок не найден.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-black font-sans">
      {/* Header */}
      <header className="border-b-2 border-black sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-6 min-w-0">
              <Button variant="ghost" onClick={onBack} className="group px-0 hover:bg-transparent hover:text-black/70">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-mono uppercase tracking-wide text-sm hidden sm:inline">К курсу</span>
              </Button>
              
              <div className="h-6 w-px bg-black/20 mx-2 hidden sm:block"></div>

              <nav 
                aria-label="Хлебные крошки"
                className="hidden md:flex items-center text-sm font-mono tracking-wide min-w-0 overflow-x-auto whitespace-nowrap pr-8"
              >
                 <button
                   type="button"
                   onClick={() => onGoToCatalog?.('all')}
                   className="text-gray-400 hover:text-black transition-colors cursor-pointer"
                 >
                   КУРСЫ
                 </button>
                 <span className="mx-2 text-gray-300">/</span>
                 <button
                   type="button"
                   onClick={() => onGoToCatalog?.(track?.id)}
                   className="text-gray-400 hover:text-black transition-colors cursor-pointer"
                 >
                   {track?.name ? track.name.toUpperCase() : 'ТРЕК'}
                 </button>
                 <span className="mx-2 text-gray-300">/</span>
                 <button
                   type="button"
                   onClick={onBack}
                   className="text-gray-400 hover:text-black transition-colors cursor-pointer"
                 >
                   {module?.title ?? 'МОДУЛЬ'}
                 </button>
                 <span className="mx-2 text-gray-300">/</span>
                 <span className="border-b-2 border-black pb-0.5 text-black">{lesson.title.toUpperCase()}</span>
              </nav>
           </div>

           <Button variant="outline" size="sm" onClick={onOpenMap} className="font-mono text-xs uppercase border-black hover:bg-black hover:text-white transition-colors rounded-none">
              Карта знаний
           </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Title Section */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-black text-white font-mono text-xs uppercase tracking-wider">
                    {lessonIndex >= 0 ? `Урок ${lessonIndex + 1}` : 'Урок'}
                  </span>
                  {lesson.videoDuration && (
                    <span className="flex items-center gap-1 text-xs font-mono text-gray-500 uppercase">
                       <Clock className="w-3 h-3" /> {lesson.videoDuration}
                    </span>
                  )}
               </div>
               <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{lesson.title.toUpperCase()}</h1>
               <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl">
                  {lesson.description}
               </p>
            </div>

            {/* Video Player */}
            {lesson.videoUrl ? (
              <div className="relative aspect-video bg-black w-full border-2 border-black shadow-[12px_12px_0px_0px_rgba(182,226,200,1)] overflow-hidden">
                <video controls className="w-full h-full">
                  <source src={lesson.videoUrl} />
                </video>
              </div>
            ) : (
              <div className="relative aspect-video bg-black w-full border-2 border-black shadow-[12px_12px_0px_0px_rgba(182,226,200,1)] group overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80')] bg-cover bg-center opacity-40"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                       <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-black border-b-[12px] border-b-transparent ml-1"></div>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <div className="font-mono text-xs mb-1 opacity-70">ВИДЕО-ЛЕКЦИЯ</div>
                    <div className="font-bold text-lg">Видео не доступно</div>
                 </div>
              </div>
            )}

            {/* Content Text */}
            <div className="prose prose-lg max-w-none font-light prose-headings:font-bold prose-headings:font-mono prose-headings:uppercase prose-p:text-gray-800 prose-strong:text-black prose-li:marker:text-black">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
            </div>

            {/* Handbook Reference */}
            {lesson.handbookExcerpts.length > 0 && (
              <div className="border-2 border-black p-6 bg-[#B6C8E2]/20 relative overflow-hidden">
                 <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#B6C8E2] rounded-full blur-2xl opacity-50"></div>
                 <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white border border-black shrink-0">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="font-mono font-bold text-lg uppercase mb-2">МАТЕРИАЛЫ ХЕНДБУКА</h4>
                       <div className="space-y-3">
                         {lesson.handbookExcerpts.map((excerpt) => (
                           <div key={excerpt.id} className="text-sm text-gray-700">
                             <div className="font-mono text-xs uppercase text-gray-500 mb-1">{excerpt.sectionTitle}</div>
                             <p>{excerpt.excerpt}</p>
                           </div>
                         ))}
                       </div>
                       <Button 
                         variant="link" 
                         onClick={onOpenHandbook}
                         className="p-0 h-auto font-mono text-xs uppercase border-b border-black rounded-none hover:no-underline hover:text-black/60 mt-4"
                       >
                          Читать главу →
                       </Button>
                    </div>
                 </div>
              </div>
            )}

            {/* Assignment Section */}
            {lesson.assignment && (
              <div className="mt-16 pt-16 border-t-2 border-black">
                 <h3 className="font-mono text-2xl font-bold uppercase mb-8 flex items-center gap-3">
                    <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">?</span>
                    Задание к уроку
                 </h3>
                 
                 <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    <p className="text-lg mb-8 font-light">
                       {lesson.assignment.description}
                    </p>

                    <div className="space-y-6">
                       {lesson.assignment.requiresText && (
                         <div>
                            <label className="block font-mono text-xs uppercase text-gray-500 mb-2">Ваш ответ</label>
                            <Textarea
                               placeholder="Начните вводить текст..."
                               rows={8}
                               value={textAnswer}
                               onChange={(e) => setTextAnswer(e.target.value)}
                               disabled={submissionStatus === 'pending' || submissionStatus === 'accepted'}
                               className="rounded-none border-2 border-gray-200 focus:border-black focus:ring-0 resize-none p-4 text-base"
                            />
                         </div>
                       )}

                       <div className="grid md:grid-cols-2 gap-6">
                          {lesson.assignment.requiresLink && (
                            <div>
                               <label className="block font-mono text-xs uppercase text-gray-500 mb-2">Ссылка на материалы</label>
                               <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                     type="url"
                                     placeholder="https://figma.com/..."
                                     value={linkUrl}
                                     onChange={(e) => setLinkUrl(e.target.value)}
                                     className="pl-10 rounded-none border-2 border-gray-200 focus:border-black focus:ring-0 h-12"
                                     disabled={submissionStatus === 'pending' || submissionStatus === 'accepted'}
                                  />
                               </div>
                            </div>
                          )}

                          {lesson.assignment.requiresFile && (
                            <div>
                               <label className="block font-mono text-xs uppercase text-gray-500 mb-2">Файл</label>
                               <div className="border-2 border-dashed border-gray-300 p-3 flex items-center justify-center gap-2 cursor-not-allowed bg-gray-50 transition-colors h-12">
                                  <Upload className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-500">Загрузка файлов пока не поддерживается</span>
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                          {getStatusBadge()}
                          
                          <Button 
                             onClick={handleSubmit}
                             disabled={submissionStatus === 'pending' || submissionStatus === 'accepted' || !canSubmit}
                             className="rounded-none bg-black text-white hover:bg-gray-800 h-12 px-8 font-mono uppercase tracking-wide disabled:opacity-50"
                          >
                             {submissionStatus === 'needs_revision' ? 'Отправить повторно' : 'Отправить на проверку'}
                          </Button>
                       </div>
                       {submissionError && (
                         <p className="text-sm font-mono text-red-600">{submissionError}</p>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between pt-8">
               <Button 
                  variant="outline" 
                  onClick={() => onNavigate?.('prev')}
                  disabled={!prevLesson}
                  className="rounded-none border-2 border-black/10 hover:border-black hover:bg-white h-12 px-6"
               >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="font-mono text-xs uppercase">Предыдущий</span>
               </Button>
               <Button 
                  onClick={() => onNavigate?.('next')}
                  disabled={!nextLesson}
                  className="rounded-none bg-black text-white hover:bg-gray-800 h-12 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all"
               >
                  <span className="font-mono text-xs uppercase">Следующий урок</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-gray-50 border border-gray-100 p-6 sticky top-24">
                <h4 className="font-mono font-bold uppercase mb-6 tracking-wide border-b border-black/10 pb-4">
                   Содержание модуля
                </h4>
                
                <div className="relative space-y-0">
                   {/* Vertical Line */}
                   <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-300"></div>

                   {moduleLessons.map((item, index) => {
                     const isCurrent = lesson.id === item.id;
                     return (
                       <div key={item.id} className={`relative pl-10 py-3 -ml-4 px-4 rounded-r ${isCurrent ? '' : 'group cursor-default'}`}>
                          <div className={`absolute left-[12px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full ${isCurrent ? 'bg-black border-2 border-white ring-1 ring-black' : 'bg-white border border-gray-400'}`}></div>
                          <div className={`text-sm ${isCurrent ? 'font-bold text-black' : 'text-gray-600'}`}>
                            Урок {index + 1}: {item.title}
                          </div>
                          {item.videoDuration && (
                            <div className="text-xs text-gray-400 font-mono mt-1">{item.videoDuration}</div>
                          )}
                          {isCurrent && (
                            <div className="text-xs text-gray-500 font-mono mt-1">Текущий урок</div>
                          )}
                       </div>
                     );
                   })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                   <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs uppercase text-gray-500">Прогресс модуля</span>
                      <span className="font-mono text-xs font-bold">{module?.progress ?? 0}%</span>
                   </div>
                   <div className="h-2 bg-gray-200 w-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${module?.progress ?? 0}%` }}></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
