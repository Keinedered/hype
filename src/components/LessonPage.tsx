import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, Upload, Link as LinkIcon, Check, Clock, X, Circle, PlayCircle, FileText } from 'lucide-react';
import { TrackId } from '../types';
import { lessonsAPI } from '../api/client';

interface LessonPageProps {
  onBack?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onOpenMap?: () => void;
  onGoToCatalog?: (trackId?: TrackId | 'all') => void;
  onOpenHandbook?: () => void;
  trackId?: TrackId;
  trackName?: string;
  courseTitle?: string;
  moduleId?: string;
  lessonId?: string;
}

export function LessonPage({ onBack, onNavigate, onOpenMap, onGoToCatalog, onOpenHandbook, trackId, trackName, courseTitle, moduleId, lessonId }: LessonPageProps) {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'not_submitted' | 'pending' | 'accepted' | 'needs_revision'>('not_submitted');

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const loadLesson = async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      setError(null);
      const lessonData = await lessonsAPI.getById(lessonId);
      setLesson(lessonData);
      // Загружаем статус submission, если есть
      // TODO: загрузить статус из API через submissionsAPI
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('Failed to load lesson:', error);
      }
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки урока';
      setError(errorMessage);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmissionStatus('pending');
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
          <div className="flex items-center gap-2 px-3 py-1 bg-[#A8D4B8] border border-black">
            <Check className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">Принято</span>
          </div>
        );
      case 'needs_revision':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#D4A5B8] border border-black">
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

  return (
    <div className="min-h-screen bg-transparent text-black font-sans">
      {/* Header */}
      <header className="border-b-2 border-black sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-6 min-w-0">
              <Button variant="ghost" onClick={onBack} className="group px-0 hover:bg-transparent hover:text-black/70">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-mono uppercase tracking-wide text-sm hidden sm:inline">К модулю</span>
              </Button>
              
              <div className="h-6 w-px bg-black/20 mx-2 hidden sm:block"></div>

              <nav 
                aria-label="Хлебные крошки"
                className="hidden md:flex items-center text-sm font-mono tracking-wide min-w-0 overflow-x-auto whitespace-nowrap pr-8"
              >
                 <button
                   type="button"
                   onClick={() => onGoToCatalog?.('all')}
                   className="text-gray-600 hover:text-black transition-colors cursor-pointer"
                 >
                   КУРСЫ
                 </button>
                 <span className="mx-2 text-gray-500">/</span>
                 <button
                   type="button"
                   onClick={() => onGoToCatalog?.(trackId)}
                   className="text-gray-600 hover:text-black transition-colors cursor-pointer"
                 >
                   {trackName ? trackName.toUpperCase() : 'ТРЕК'}
                 </button>
                 <span className="mx-2 text-gray-500">/</span>
                 <button
                   type="button"
                   onClick={onBack}
                   className="text-gray-600 hover:text-black transition-colors cursor-pointer"
                 >
                   МОДУЛЬ 1
                 </button>
                 <span className="mx-2 text-gray-500">/</span>
                 <span className="border-b-2 border-black pb-0.5 text-black">ЧТО ТАКОЕ ПРОДУКТ</span>
              </nav>
           </div>

           <Button variant="outline" size="sm" onClick={onOpenMap} className="font-mono text-xs uppercase border-black hover:bg-black hover:text-white transition-colors rounded-none">
              Карта знаний
           </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin rounded-full" />
              <p className="text-foreground font-mono">Загрузка урока...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-2 border-black bg-white p-6 max-w-2xl mx-auto">
            <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
              ОШИБКА
            </div>
            <p className="text-foreground font-mono mb-4">{error}</p>
            <button
              onClick={loadLesson}
              className="border-2 border-black px-4 py-2 font-mono text-sm hover:bg-black hover:text-white transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : !lesson ? (
          <div className="text-center py-20 border-2 border-black bg-white p-6 max-w-2xl mx-auto">
            <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
              НЕ НАЙДЕНО
            </div>
            <p className="text-foreground font-mono">Урок не найден</p>
          </div>
        ) : (
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Title Section */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-black text-white font-mono text-xs uppercase tracking-wider">Урок 1</span>
                  <span className="flex items-center gap-1 text-xs font-mono text-gray-700 uppercase">
                     <Clock className="w-3 h-3" /> 15 минут
                  </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">ЧТО ТАКОЕ ПРОДУКТ</h1>
               <p className="text-xl text-gray-700 font-light leading-relaxed max-w-2xl">
                  Разберем определение продукта, его ключевые характеристики и отличия от проекта.
               </p>
            </div>

            {/* Video Player Placeholder */}
            <div className="relative aspect-video bg-black w-full border-2 border-black shadow-[12px_12px_0px_0px_rgba(182,226,200,1)] group cursor-pointer overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80')] bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-black border-b-[12px] border-b-transparent ml-1"></div>
                  </div>
               </div>
               
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="font-mono text-xs mb-1 opacity-70">ВИДЕО-ЛЕКЦИЯ</div>
                  <div className="font-bold text-lg">Введение в продуктовую методологию</div>
               </div>
            </div>

            {/* Content Text */}
            <div className="prose prose-lg max-w-none font-light prose-headings:font-bold prose-headings:font-mono prose-headings:uppercase prose-p:text-gray-800 prose-strong:text-black prose-li:marker:text-black">
               <h3>Конспект урока</h3>
               <p>
                  <strong className="bg-[#A8D4B8] px-1">Продукт</strong> — это средство решения проблемы пользователя, 
                  которое приносит ценность как пользователю, так и бизнесу. В отличие от проекта, продукт не имеет фиксированной даты завершения, он живет, пока нужен пользователям.
               </p>
               <p>
                  В контексте цифровых продуктов мы говорим о веб-сервисах, мобильных приложениях, 
                  SaaS-платформах и других цифровых решениях.
               </p>
               
               <div className="my-8 p-8 border-l-4 border-black bg-gray-50 italic">
                  "Роль продакт-менеджера — обеспечить баланс между потребностями пользователей, 
                  целями бизнеса и техническими возможностями команды."
               </div>

               <h4>Ключевые характеристики</h4>
               <ul>
                  <li>Решает конкретную проблему пользователя</li>
                  <li>Приносит измеримую ценность (Value)</li>
                  <li>Имеет чёткую целевую аудиторию (Segment)</li>
                  <li>Постоянно развивается на основе обратной связи (Feedback Loop)</li>
               </ul>
            </div>

            {/* Handbook Reference */}
            <div className="border-2 border-black p-6 bg-[#A8B8D4]/20 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#A8B8D4] rounded-full blur-2xl opacity-50"></div>
               <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-white border border-black shrink-0">
                     <FileText className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-mono font-bold text-lg uppercase mb-2">МАТЕРИАЛЫ ХЕНДБУКА</h4>
                     <p className="text-sm text-gray-700 mb-4 max-w-md">
                        Для углубленного изучения темы обратитесь к главе "Продуктовая стратегия" в нашем учебнике.
                     </p>
                     <Button 
                       variant="link" 
                       onClick={onOpenHandbook}
                       className="p-0 h-auto font-mono text-xs uppercase border-b border-black rounded-none hover:no-underline hover:text-black/60"
                     >
                        Читать главу →
                     </Button>
                  </div>
               </div>
            </div>

            {/* Assignment Section */}
            <div className="mt-16 pt-16 border-t-2 border-black">
               <h3 className="font-mono text-2xl font-bold uppercase mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">?</span>
                  Задание к уроку
               </h3>
               
               <div className="bg-white border border-gray-200 p-8 shadow-sm">
                  <p className="text-lg mb-8 font-light">
                     Опишите продукт, с которым вы взаимодействуете ежедневно. 
                     Какую проблему он решает? Какую ценность приносит вам?
                  </p>

                  <div className="space-y-6">
                     <div>
                        <label className="block font-mono text-xs uppercase text-gray-700 mb-2">Ваш ответ</label>
                        <Textarea
                           placeholder="Начните вводить текст..."
                           rows={8}
                           value={textAnswer}
                           onChange={(e) => setTextAnswer(e.target.value)}
                           disabled={submissionStatus === 'pending' || submissionStatus === 'accepted'}
                           className="rounded-none border-2 border-gray-200 focus:border-black focus:ring-0 resize-none p-4 text-base"
                        />
                     </div>

                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                           <label className="block font-mono text-xs uppercase text-gray-700 mb-2">Ссылка на материалы</label>
                           <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
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

                        <div>
                           <label className="block font-mono text-xs uppercase text-gray-700 mb-2">Файл</label>
                           <div className="border-2 border-dashed border-gray-300 p-3 flex items-center justify-center gap-2 cursor-pointer hover:border-black hover:bg-gray-50 transition-colors h-12">
                              <Upload className="w-4 h-4 text-gray-700" />
                              <span className="text-sm text-gray-700">Загрузить файл</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                        {getStatusBadge()}
                        
                        <Button 
                           onClick={handleSubmit}
                           disabled={submissionStatus === 'pending' || submissionStatus === 'accepted' || !textAnswer.trim()}
                           className="rounded-none bg-black text-white hover:bg-gray-800 h-12 px-8 font-mono uppercase tracking-wide disabled:opacity-50"
                        >
                           {submissionStatus === 'needs_revision' ? 'Отправить повторно' : 'Отправить на проверку'}
                        </Button>
                     </div>
                  </div>
                  
                  {submissionStatus === 'needs_revision' && (
                     <div className="mt-6 p-6 bg-[#D4A5B8]/20 border border-[#D4A5B8] flex gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shrink-0 font-mono text-xs">A</div>
                        <div>
                           <div className="font-mono text-xs uppercase text-gray-700 mb-1">Куратор Анна • 2 часа назад</div>
                           <p>Хороший анализ, но попробуйте добавить больше деталей о том, какую конкретно ценность продукт приносит бизнесу.</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between pt-8">
               <Button 
                  variant="outline" 
                  onClick={() => onNavigate?.('prev')}
                  className="rounded-none border-2 border-black/10 hover:border-black hover:bg-white h-12 px-6"
               >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="font-mono text-xs uppercase">Предыдущий</span>
               </Button>
               <Button 
                  onClick={() => onNavigate?.('next')}
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

                   {/* Lesson Items */}
                   <div className="relative pl-10 py-2">
                      <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-black border-2 border-white ring-1 ring-black"></div>
                      <div className="font-bold text-sm">Урок 1: Что такое продукт</div>
                      <div className="text-xs text-gray-600 font-mono mt-1">Текущий урок</div>
                   </div>

                   <div className="relative pl-10 py-3 group cursor-pointer hover:bg-black/5 transition-colors -ml-4 px-4 rounded-r">
                      <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-white border border-gray-400 group-hover:border-black transition-colors"></div>
                      <div className="text-sm text-gray-700 group-hover:text-black transition-colors">Урок 2: Виды продуктов</div>
                      <div className="text-xs text-gray-600 font-mono mt-1">12 минут</div>
                   </div>

                   <div className="relative pl-10 py-3 group cursor-pointer hover:bg-black/5 transition-colors -ml-4 px-4 rounded-r">
                      <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-white border border-gray-600 group-hover:border-black transition-colors"></div>
                      <div className="text-sm text-gray-700 group-hover:text-black transition-colors">Урок 3: Роль PM в команде</div>
                      <div className="text-xs text-gray-600 font-mono mt-1">20 минут</div>
                   </div>

                   <div className="relative pl-10 py-3 group cursor-pointer hover:bg-black/5 transition-colors -ml-4 px-4 rounded-r opacity-50">
                      <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-white border border-gray-500"></div>
                      <div className="text-sm text-gray-600">Урок 4: Циклы разработки</div>
                      <div className="text-xs text-gray-600 font-mono mt-1 flex items-center gap-1">
                         <PlayCircle className="w-3 h-3" /> 18 минут
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                   <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs uppercase text-gray-700">Прогресс модуля</span>
                      <span className="font-mono text-xs font-bold">25%</span>
                   </div>
                   <div className="h-2 bg-gray-200 w-full overflow-hidden">
                      <div className="h-full bg-black w-1/4"></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
        )}
      </main>
    </div>
  );
}