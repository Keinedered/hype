import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Upload, Link as LinkIcon, Check, Clock, X, Circle, FileText } from 'lucide-react';
import { TrackId, Lesson, Module, Track } from '../types';
import { coursesAPI, lessonsAPI, modulesAPI, submissionsAPI, tracksAPI } from '../api/client';
import { normalizeCourse, normalizeLesson, normalizeModule, normalizeTrack, RawCourse, RawLesson, RawModule, RawTrack } from '../api/normalizers';
import { toAbsolutePublicUrl } from '../api/urls';
import { Skeleton } from './ui/skeleton';

interface LessonPageProps {
  onBack?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onSelectLesson?: (lessonId: string) => void;
  onOpenMap?: () => void;
  onGoToCatalog?: (trackId?: TrackId | 'all') => void;
  onOpenHandbook?: () => void;
  lessonId?: string;
}

export function LessonPage({ onBack, onNavigate, onSelectLesson, onOpenMap, onGoToCatalog, onOpenHandbook, lessonId }: LessonPageProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [textAnswer, setTextAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionsList, setSubmissionsList] = useState<Array<{
    id: string;
    assignment_id: string;
    version: number;
    text_answer?: string | null;
    link_url?: string | null;
    file_urls?: string[];
    status?: typeof submissionStatus;
    curator_comment?: string | null;
    submitted_at?: string | null;
  }>>([]);
  const [submissionStatus, setSubmissionStatus] = useState<'not_submitted' | 'pending' | 'accepted' | 'needs_revision'>('not_submitted');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const fileUrlsRef = useRef<string[]>([]);
  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    fileUrlsRef.current = fileUrls;
  }, [fileUrls]);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  useEffect(() => {
    return () => {
      if (submissionIdRef.current) {
        return;
      }
      const pendingFiles = fileUrlsRef.current;
      if (pendingFiles.length === 0) {
        return;
      }
      pendingFiles.forEach((fileUrl) => {
        void submissionsAPI.deleteUpload(fileUrl);
      });
    };
  }, []);

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

        const extractLessons = (value: unknown): RawLesson[] => {
          if (Array.isArray(value)) return value as RawLesson[];
          if (value && typeof value === 'object') {
            const record = value as { lessons?: unknown; items?: unknown };
            if (Array.isArray(record.lessons)) return record.lessons as RawLesson[];
            if (Array.isArray(record.items)) return record.items as RawLesson[];
          }
          return [];
        };

        const [rawTrack, rawModuleLessons] = await Promise.all([
          tracksAPI.getById(normalizedCourse.trackId),
          lessonsAPI.getByModuleId(normalizedModule.id),
        ]);

        const normalizedTrack = normalizeTrack(rawTrack as RawTrack);
        let normalizedModuleLessons = extractLessons(rawModuleLessons)
          .map(normalizeLesson)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        if (normalizedModuleLessons.length === 0 && normalizedModule.lessons.length > 0) {
          normalizedModuleLessons = [...normalizedModule.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        }

        const loadExistingSubmission = async () => {
          if (!isMounted) return;
          if (!normalizedLesson.assignment) {
            return;
          }
          try {
            const submissions = (await submissionsAPI.getAll()) as Array<{
              id: string;
              assignment_id: string;
              version: number;
              text_answer?: string | null;
              link_url?: string | null;
              file_urls?: string[];
              status?: typeof submissionStatus;
              curator_comment?: string | null;
              submitted_at?: string | null;
            }>;
            const assignmentSubmissions = submissions
              .filter((submission) => submission.assignment_id === normalizedLesson.assignment?.id)
              .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
            const latest = assignmentSubmissions[0];
            setSubmissionsList(assignmentSubmissions);
            if (latest) {
              setSubmissionId(latest.id);
              setSubmissionStatus(latest.status ?? 'pending');
              setTextAnswer(latest.text_answer ?? '');
              setLinkUrl(latest.link_url ?? '');
              setFileUrls(latest.file_urls ?? []);
            }
          } catch {
            // Ignore submission load errors
          }
        };

        if (!isMounted) return;
        setLesson(normalizedLesson);
        setModule(normalizedModule);
        setTrack(normalizedTrack);
        setModuleLessons(normalizedModuleLessons);
        setTextAnswer('');
        setLinkUrl('');
        setFileUrls([]);
        setSubmissionId(null);
        setSubmissionStatus('not_submitted');
        setSubmissionError(null);
        setSubmissionsList([]);
        await loadExistingSubmission();
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
    const hasText = textAnswer.trim().length > 0;
    const hasLink = linkUrl.trim().length > 0;
    const hasFiles = fileUrls.length > 0;

    if (lesson.assignment.requiresAny) {
      const hasRequired =
        (lesson.assignment.requiresText && hasText)
        || (lesson.assignment.requiresLink && hasLink)
        || (lesson.assignment.requiresFile && hasFiles);
      return (
        (lesson.assignment.requiresText || lesson.assignment.requiresLink || lesson.assignment.requiresFile)
        ? hasRequired
        : false
      );
    }

    if (lesson.assignment.requiresText && !hasText) return false;
    if (lesson.assignment.requiresLink && !hasLink) return false;
    if (lesson.assignment.requiresFile && !hasFiles) return false;
    return true;
  }, [lesson, linkUrl, textAnswer, fileUrls]);

  const handleSubmit = async () => {
    if (!lesson?.assignment) return;
    try {
      setSubmissionError(null);
      setSubmissionStatus('pending');
      const payload = {
        text_answer: textAnswer.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
        file_urls: fileUrls,
      };
      const shouldCreateNewVersion = !submissionId || submissionStatus === 'needs_revision';
      const response = shouldCreateNewVersion
        ? await submissionsAPI.create({
          assignment_id: lesson.assignment.id,
          ...payload,
        })
        : await submissionsAPI.update(submissionId, payload);
      const status = (response as { status?: string }).status as typeof submissionStatus | undefined;
      const id = (response as { id?: string }).id;
      if (id) {
        setSubmissionId(id);
      }
      setSubmissionStatus(status ?? 'pending');
      try {
        const submissions = (await submissionsAPI.getAll()) as Array<{
          id: string;
          assignment_id: string;
          version: number;
          text_answer?: string | null;
          link_url?: string | null;
          file_urls?: string[];
          status?: typeof submissionStatus;
          curator_comment?: string | null;
          submitted_at?: string | null;
        }>;
        const assignmentSubmissions = submissions
          .filter((submission) => submission.assignment_id === lesson.assignment.id)
          .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
        setSubmissionsList(assignmentSubmissions);
      } catch {
        // ignore refresh errors
      }
    } catch (err) {
      setSubmissionStatus('not_submitted');
      setSubmissionError(err instanceof Error ? err.message : 'Не удалось отправить задание');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    try {
      setFileUploading(true);
      setSubmissionError(null);
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const response = await submissionsAPI.uploadFile(file);
        const fileUrl = (response as { file_url?: string }).file_url;
        if (fileUrl) {
          uploadedUrls.push(fileUrl);
        }
      }
      if (uploadedUrls.length) {
        setFileUrls((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Не удалось загрузить файлы');
    } finally {
      setFileUploading(false);
    }
  };

  const handleUnsend = async () => {
    if (!submissionId) return;
    try {
      setSubmissionError(null);
      await submissionsAPI.delete(submissionId);
      setSubmissionStatus('not_submitted');
      setSubmissionId(null);
      setSubmissionsList((prev) => prev.filter((item) => item.id !== submissionId));
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Не удалось отозвать задание');
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

  const inputsLocked = submissionStatus === 'pending' || submissionStatus === 'accepted';

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
                  {lesson.videoUrl && lesson.videoDuration && (
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
            {lesson.videoUrl && (
              <div className="relative aspect-video bg-black w-full border-2 border-black shadow-[12px_12px_0px_0px_rgba(182,226,200,1)] overflow-hidden">
                <video controls className="w-full h-full">
                  <source src={lesson.videoUrl} />
                </video>
              </div>
            )}

            {/* Content Text */}
            <div className="max-w-none font-light text-gray-800 space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (props) => (
                    <h1 className="mt-10 mb-4 text-3xl md:text-4xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  h2: (props) => (
                    <h2 className="mt-8 mb-3 text-2xl md:text-3xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  h3: (props) => (
                    <h3 className="mt-6 mb-2 text-xl md:text-2xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  h4: (props) => (
                    <h4 className="mt-5 mb-2 text-lg md:text-xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  h5: (props) => (
                    <h5 className="mt-4 mb-2 text-base md:text-lg font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  h6: (props) => (
                    <h6 className="mt-4 mb-2 text-sm md:text-base font-bold font-mono uppercase tracking-wide text-black" {...props} />
                  ),
                  p: (props) => <p className="leading-relaxed" {...props} />,
                  ul: (props) => <ul className="list-disc pl-6 space-y-2" {...props} />,
                  ol: (props) => <ol className="list-decimal pl-6 space-y-2" {...props} />,
                  li: (props) => <li className="marker:text-black" {...props} />,
                }}
              >
                {lesson.content}
              </ReactMarkdown>
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
                               disabled={inputsLocked}
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
                                     disabled={inputsLocked}
                                  />
                               </div>
                            </div>
                          )}

                          {lesson.assignment.requiresFile && (
                            <div>
                               <label className="block font-mono text-xs uppercase text-gray-500 mb-2">Файлы</label>
                               <div className="space-y-2">
                                  <label className={`border-2 border-dashed p-3 flex items-center justify-center gap-2 transition-colors h-12 ${inputsLocked ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'cursor-pointer bg-white hover:border-black'}`}>
                                     <Upload className="w-4 h-4" />
                                     <span className="text-sm">
                                       {fileUploading ? 'Загрузка...' : 'Загрузить файлы'}
                                     </span>
                                     <Input
                                       type="file"
                                       multiple
                                       disabled={inputsLocked || fileUploading}
                                       onChange={(event) => {
                                         const files = event.target.files;
                                         if (files && files.length > 0) {
                                           void handleFileUpload(files);
                                         }
                                         event.target.value = '';
                                       }}
                                       className="hidden"
                                     />
                                  </label>
                                  {fileUrls.length > 0 && (
                                    <div className="space-y-1">
                                      {fileUrls.map((fileUrl) => {
                                        const displayUrl = toAbsolutePublicUrl(fileUrl) ?? fileUrl;
                                        return (
                                        <div key={fileUrl} className="flex items-center justify-between gap-2 text-xs">
                                          <a
                                            href={displayUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="break-all text-blue-600 hover:text-blue-800"
                                          >
                                            {displayUrl}
                                          </a>
                                          {!inputsLocked && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="h-7 px-2 text-xs"
                                              onClick={() => {
                                                setFileUrls((prev) => prev.filter((url) => url !== fileUrl));
                                                if (!submissionId) {
                                                  void submissionsAPI.deleteUpload(fileUrl);
                                                }
                                              }}
                                            >
                                              Удалить
                                            </Button>
                                          )}
                                        </div>
                                      );
                                      })}
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                          {getStatusBadge()}

                          <Button
                             onClick={handleSubmit}
                             disabled={inputsLocked || !canSubmit}
                             className="rounded-none bg-black text-white hover:bg-gray-800 h-12 px-8 font-mono uppercase tracking-wide disabled:opacity-50"
                          >
                             {submissionStatus === 'needs_revision' ? 'Отправить повторно' : 'Отправить на проверку'}
                          </Button>
                       </div>
                       {submissionStatus === 'pending' && submissionId && (
                         <Button
                           type="button"
                           variant="outline"
                           className="mt-4 rounded-none border-2 border-black font-mono uppercase tracking-wide"
                           onClick={handleUnsend}
                         >
                           Отозвать отправку
                         </Button>
                       )}
                       {submissionError && (
                         <p className="text-sm font-mono text-red-600">{submissionError}</p>
                       )}
                       {submissionsList.length > 0 && (
                         <div className="mt-6 border-t border-gray-200 pt-4 space-y-3">
                           <div className="font-mono text-xs uppercase tracking-wide text-gray-500">Мои отправки</div>
                           <div className="space-y-2">
                             {submissionsList.map((item) => (
                               <div key={item.id} className="border border-black/10 p-3 text-xs space-y-2">
                                 <div className="flex flex-wrap items-center justify-between gap-2">
                                   <span className="font-mono uppercase">v{item.version}</span>
                                   <span className="font-mono uppercase">{item.status ?? 'pending'}</span>
                                 </div>
                                 {item.submitted_at && (
                                   <div className="text-gray-500">Отправлено: {new Date(item.submitted_at).toLocaleString('ru-RU')}</div>
                                 )}
                                 {item.curator_comment && (
                                   <div className="text-gray-700">
                                     Комментарий: {item.curator_comment}
                                   </div>
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between pt-8">
              <Button
                 variant="outline"
                 onClick={() => {
                   if (prevLesson) {
                     onSelectLesson?.(prevLesson.id);
                   }
                   onNavigate?.('prev');
                 }}
                 disabled={!prevLesson}
                 className="rounded-none border-2 border-black/10 hover:border-black hover:bg-white h-12 px-6"
              >
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 <span className="font-mono text-xs uppercase">Предыдущий</span>
              </Button>
              <Button
                 onClick={() => {
                   if (nextLesson) {
                     onSelectLesson?.(nextLesson.id);
                   }
                   onNavigate?.('next');
                 }}
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
                       <button
                         key={item.id}
                         type="button"
                         onClick={() => onSelectLesson?.(item.id)}
                         className={`relative w-full text-left pl-10 py-3 -ml-4 px-4 rounded-r transition-colors ${isCurrent ? '' : 'group hover:bg-white/70'} ${isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
                         disabled={isCurrent}
                       >
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
                       </button>
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
