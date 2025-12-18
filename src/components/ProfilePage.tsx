import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Check, Clock, X, Bell, ArrowRight, Settings, HelpCircle, MessageSquare, Facebook, Twitter, Instagram } from 'lucide-react';
import profileAvatar from '../public/images/викс.png';

interface ProfilePageProps {
  onNavigateToLesson?: (lessonId: string) => void;
  initialTab?: 'settings' | 'submissions' | 'faq' | 'notifications';
}

export function ProfilePage({ onNavigateToLesson, initialTab = 'settings' }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [isProgressVisible, setIsProgressVisible] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const mockNotifications = [
    {
      id: '1',
      type: 'submission_reviewed' as const,
      title: 'ЗАДАНИЕ ПРОВЕРЕНО',
      message: 'Ваше задание по уроку "Интервью с пользователями" требует доработки',
      time: '2 часа назад',
      isRead: false,
      relatedUrl: 'lesson/3',
      color: '#E2B6C8'
    },
    {
      id: '2',
      type: 'new_branch_unlocked' as const,
      title: 'ОТКРЫТА НОВАЯ ВЕТКА',
      message: 'Теперь вам доступен Модуль 3: Постановка задач и метрик',
      time: '1 день назад',
      isRead: false,
      relatedUrl: 'course/product-intro',
      color: '#B6E2C8'
    },
    {
      id: '3',
      type: 'reminder' as const,
      title: 'НЕ ЗАБУДЬТЕ',
      message: 'У вас есть незавершённое задание в курсе "Внешние коммуникации компании"',
      time: '2 дня назад',
      isRead: true,
      relatedUrl: 'lesson/5',
      color: '#B6C8E2'
    }
  ];

  const mockSubmissions = [
    {
      id: '1',
      courseName: 'Введение в продуктовый менеджмент',
      moduleName: 'Модуль 1: Роль продукта',
      lessonName: 'Урок 1: Что такое продукт',
      status: 'accepted' as const,
      submittedAt: '15.12.2025',
      reviewedAt: '16.12.2025',
      trackColor: '#B6E2C8' // Digital
    },
    {
      id: '2',
      courseName: 'Введение в продуктовый менеджмент',
      moduleName: 'Модуль 1: Роль продукта',
      lessonName: 'Урок 2: Виды продуктов',
      status: 'pending' as const,
      submittedAt: '15.12.2025',
      trackColor: '#B6E2C8' // Digital
    },
    {
      id: '3',
      courseName: 'Продуктовый дизайн и интерфейсы',
      moduleName: 'Модуль 2: UX исследования',
      lessonName: 'Урок 3: Интервью с пользователями',
      status: 'needs_revision' as const,
      submittedAt: '14.12.2025',
      reviewedAt: '15.12.2025',
      trackColor: '#C8B6E2' // Design
    }
  ];

  const faqItems = [
    {
      question: 'Как получить доступ к курсу?',
      answer: 'После регистрации все курсы становятся доступными в каталоге. Просто выберите интересующий курс и нажмите "Начать обучение".'
    },
    {
      question: 'Как работает система проверки заданий?',
      answer: 'После отправки задания куратор проверит его в течение 48 часов. Вы получите уведомление о результате проверки.'
    },
    {
      question: 'Можно ли проходить несколько курсов одновременно?',
      answer: 'Да, вы можете проходить любое количество курсов параллельно. Ваш прогресс сохраняется по каждому курсу отдельно.'
    },
    {
      question: 'Что такое карта знаний?',
      answer: 'Карта знаний — это визуальное представление структуры курса в виде графа, где каждая вершина — это тема или урок, а связи показывают зависимости между темами.'
    },
    {
      question: 'Как получить сертификат?',
      answer: 'После успешного завершения всех модулей и выполнения финального проекта вы автоматически получите сертификат на указанный email.'
    }
  ];

  const getStatusText = (status: string) => {
     switch (status) {
      case 'pending': return 'НА ПРОВЕРКЕ';
      case 'accepted': return 'ПРИНЯТО';
      case 'needs_revision': return 'НУЖНА ДОРАБОТКА';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-black">
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div className="relative inline-block mb-4">
            <div className="bg-black text-white px-4 py-2 inline-block">
              <h1 className="text-2xl font-mono tracking-widest mb-0 uppercase">Личный кабинет</h1>
            </div>
            <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-mono font-bold uppercase text-sm sm:text-base">Анна Петрова</div>
                <div className="text-xs sm:text-sm text-gray-500 font-mono">
                  Level 4 <span className="mx-1">/</span> Студент
                </div>
              </div>
              <div className="w-16 h-16 border-2 border-black overflow-hidden bg-white relative">
                <img src={profileAvatar} alt="Аватар профиля" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-l-4 border-black pl-4 mb-12">
          <p className="font-mono text-sm uppercase tracking-wide text-gray-500 max-w-md">
            Отслеживайте свой прогресс и получайте обратную связь от кураторов
          </p>
        </div>

        <Tabs value={activeTab} className="space-y-12" onValueChange={(val) => setActiveTab(val as any)}>
          <TabsList className="w-full bg-transparent border-b-2 border-black rounded-none p-0 h-auto !grid grid-cols-2 gap-x-6 gap-y-2 md:!flex md:gap-8">
            <TabsTrigger 
              value="settings" 
              className="bg-transparent w-full min-w-0 justify-center text-center whitespace-normal leading-tight rounded-none border-b-4 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none py-3 md:py-4 px-0 font-mono text-sm md:text-lg uppercase tracking-normal md:tracking-wide hover:text-black/70 transition-colors"
            >
              Настройки
            </TabsTrigger>
            <TabsTrigger 
              value="submissions" 
              className="bg-transparent w-full min-w-0 justify-center text-center whitespace-normal leading-tight rounded-none border-b-4 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none py-3 md:py-4 px-0 font-mono text-sm md:text-lg uppercase tracking-normal md:tracking-wide hover:text-black/70 transition-colors"
            >
              <span className="md:hidden">Задания</span>
              <span className="hidden md:inline">История заданий</span>
            </TabsTrigger>
            <TabsTrigger 
              value="faq" 
              className="bg-transparent w-full min-w-0 justify-center text-center whitespace-normal leading-tight rounded-none border-b-4 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none py-3 md:py-4 px-0 font-mono text-sm md:text-lg uppercase tracking-normal md:tracking-wide hover:text-black/70 transition-colors"
            >
              FAQ
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="bg-transparent w-full min-w-0 justify-center text-center whitespace-normal leading-tight rounded-none border-b-4 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none py-3 md:py-4 px-0 font-mono text-sm md:text-lg uppercase tracking-normal md:tracking-wide hover:text-black/70 transition-colors"
            >
              Уведомления
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6 relative">
              {/* Decorative lines */}
              <div className="absolute top-0 right-0 w-px h-6 bg-black" />
              <div className="absolute top-0 right-0 w-6 h-px bg-black" />
              <div className="absolute bottom-0 left-0 w-px h-6 bg-black" />
              <div className="absolute bottom-0 left-0 w-6 h-px bg-black" />
              
              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                ПРОФИЛЬ
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wide mb-2">Имя</label>
                    <input 
                      type="text" 
                      defaultValue="Анна Петрова" 
                      className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wide mb-2">Email</label>
                    <input 
                      type="email" 
                      defaultValue="anna@example.com" 
                      className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wide mb-2">ID участника</label>
                    <input 
                      type="text" 
                      defaultValue="GRP-2025-4892" 
                      disabled
                      className="w-full px-3 py-2 border-2 border-black font-mono bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wide mb-2">Дата рождения</label>
                    <input 
                      type="date" 
                      defaultValue="1998-05-15" 
                      className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide mb-2">О себе</label>
                  <textarea 
                    defaultValue="Студент курсов по продуктовому менеджменту" 
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>
                <Button className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono uppercase tracking-wide mt-4">
                  Сохранить изменения
                </Button>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6 relative">
              {/* Decorative lines */}
              <div className="absolute top-0 right-0 w-px h-6 bg-black" />
              <div className="absolute top-0 right-0 w-6 h-px bg-black" />

              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                ПРИВАТНОСТЬ
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-black/20">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sm uppercase">Показывать профиль</div>
                    <div className="text-xs font-mono text-gray-600 mt-1">
                      Другие студенты могут видеть ваш профиль
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Переключить видимость профиля"
                    aria-pressed={isProfileVisible}
                    onClick={() => setIsProfileVisible((v) => !v)}
                    className={`relative w-12 h-6 shrink-0 border-2 border-black transition-colors self-end sm:self-auto ${
                      isProfileVisible ? 'bg-[#B6E2C8]' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`absolute top-0 h-full w-6 bg-black transition-all ${
                        isProfileVisible ? 'right-0' : 'left-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sm uppercase">Показывать прогресс</div>
                    <div className="text-xs font-mono text-gray-600 mt-1">
                      Отображать ваши достижения публично
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Переключить видимость прогресса"
                    aria-pressed={isProgressVisible}
                    onClick={() => setIsProgressVisible((v) => !v)}
                    className={`relative w-12 h-6 shrink-0 border-2 border-black transition-colors self-end sm:self-auto ${
                      isProgressVisible ? 'bg-[#B6E2C8]' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`absolute top-0 h-full w-6 bg-black transition-all ${
                        isProgressVisible ? 'right-0' : 'left-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6 relative">
               <div className="absolute top-0 right-0 w-px h-6 bg-black" />
               <div className="absolute top-0 right-0 w-6 h-px bg-black" />
               
              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                ОПАСНАЯ ЗОНА
              </div>
              <div className="space-y-4">
                <div className="p-4 border-2 border-black bg-gray-50">
                  <div className="font-mono font-bold text-sm uppercase mb-2">Удалить аккаунт</div>
                  <p className="text-xs font-mono text-gray-600 mb-4">Это действие нельзя отменить. Все ваши данные будут удалены навсегда.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-2 border-black bg-white text-red-700 hover:bg-red-100 hover:text-red-900 font-mono uppercase tracking-wide cursor-pointer"
                      >
                        Удалить аккаунт
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-mono uppercase tracking-wide">
                          Удалить аккаунт?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-sm">
                          Это действие нельзя отменить. Все ваши данные будут удалены навсегда.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-2 border-black rounded-none font-mono uppercase tracking-wide">
                          Отмена
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="border-2 border-black rounded-none bg-red-100 text-black hover:bg-red-200 font-mono uppercase tracking-wide"
                          onClick={() => {
                            // demo action: wire to backend when available
                            console.log('Delete account confirmed');
                          }}
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <div className="grid gap-4">
              {mockSubmissions.map((submission) => (
                <div key={submission.id}>
                  <div className="group relative bg-white/90 backdrop-blur-sm border-2 border-black p-6 hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: submission.trackColor }} />
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pl-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-mono border border-black uppercase ${
                            submission.status === 'accepted' ? 'bg-white text-black' : 
                            submission.status === 'needs_revision' ? 'bg-black text-white' : 'bg-white text-gray-500 dashed-border'
                          }`}>
                            {getStatusText(submission.status)}
                          </span>
                          <span className="text-xs font-mono text-gray-500">{submission.submittedAt}</span>
                        </div>
                        <h3 className="text-xl font-bold font-mono uppercase">{submission.lessonName}</h3>
                        <p className="font-mono text-sm text-gray-600">
                          {submission.courseName} <span className="mx-2">/</span> {submission.moduleName}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        {submission.status === 'needs_revision' && (
                           <div className="hidden md:block text-right mr-4 max-w-xs">
                              <p className="text-xs border border-black p-2 font-mono uppercase">
                                 Коммент: Добавьте детали...
                              </p>
                           </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="border-2 border-black hover:bg-black hover:text-white transition-colors rounded-none font-mono uppercase tracking-wide gap-2"
                          onClick={() => onNavigateToLesson?.(submission.id)}
                        >
                          Открыть <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {mockSubmissions.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-black">
                <p className="font-mono text-gray-400 uppercase">Нет заданий</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            {/* FAQ List */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6 relative">
              <div className="absolute top-0 right-0 w-px h-6 bg-black" />
              <div className="absolute top-0 right-0 w-6 h-px bg-black" />

              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                ЧАСТЫЕ ВОПРОСЫ
              </div>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-l-4 border-black pl-4 py-2">
                    <h3 className="font-mono font-bold text-sm uppercase mb-2">{item.question}</h3>
                    <p className="font-mono text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6">
              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                ОБРАТНАЯ СВЯЗЬ
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide mb-2">Тема обращения</label>
                  <input 
                    type="text" 
                    placeholder="Например: Вопрос о курсе" 
                    className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide mb-2">Сообщение</label>
                  <textarea 
                    placeholder="Опишите ваш вопрос или предложение..." 
                    rows={5}
                    className="w-full px-3 py-2 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-black resize-none placeholder:text-gray-400"
                  />
                </div>
                <Button className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono uppercase tracking-wide w-full md:w-auto">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Отправить
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6">
              <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                МЫ В СОЦСЕТЯХ
              </div>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#" 
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-mono text-sm uppercase tracking-wide"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-mono text-sm uppercase tracking-wide"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-mono text-sm uppercase tracking-wide"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
             <div className="bg-white/90 backdrop-blur-sm border-2 border-black p-6 relative">
                <div className="absolute top-0 right-0 w-px h-6 bg-black" />
                <div className="absolute top-0 right-0 w-6 h-px bg-black" />
                
                <div className="bg-black text-white px-3 py-2 inline-block mb-6 font-mono text-sm tracking-wide">
                  ВСЕ УВЕДОМЛЕНИЯ
                </div>
                <div className="divide-y-2 divide-black">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-gray-50/50' : ''}`}
                      onClick={() => onNavigateToLesson?.(notification.relatedUrl.split('/').pop() || '')}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-1 h-full mt-1"
                          style={{ backgroundColor: notification.color }}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-mono font-bold text-xs uppercase tracking-wide">{notification.title}</h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-black rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm font-mono text-gray-600 leading-relaxed">{notification.message}</p>
                          <span className="text-xs font-mono text-gray-400">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}