import { useState } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { HeroSection } from './components/HeroSection';
import { CourseCatalog } from './components/CourseCatalog';
import { CoursePage } from './components/CoursePage';
import { LessonPage } from './components/LessonPage';
import { MyCoursesPage } from './components/MyCoursesPage';
import { ProfilePage } from './components/ProfilePage';
import { KnowledgeGraphPage } from './components/KnowledgeGraphPage';
import { HandbookPage } from './components/HandbookPage';
import { courses, tracks } from './data/mockData';
import { SmoothLinesBackground } from './components/ui/SmoothLinesBackground';
import { TrackId } from './types';

type Page = 'home' | 'catalog' | 'path' | 'courses' | 'about' | 'profile' | 'course' | 'lesson' | 'handbook';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [catalogSelectedTrack, setCatalogSelectedTrack] = useState<TrackId | 'all'>('all');

  const [profileTab, setProfileTab] = useState<'settings' | 'submissions' | 'faq' | 'notifications'>('settings');

  const handleNavigate = (page: string) => {
    if (page.startsWith('lesson/')) {
       const lessonId = page.split('/')[1];
       setSelectedLessonId(lessonId);
       setCurrentPage('lesson');
       return;
    }
    if (page.startsWith('course/')) {
       const courseId = page.split('/')[1];
       setSelectedCourseId(courseId);
       setCurrentPage('course');
       return;
    }
    if (page.startsWith('handbook/')) {
       const courseId = page.split('/')[1];
       setSelectedCourseId(courseId);
       setCurrentPage('handbook');
       return;
    }
    
    if (page === 'profile-notifications') {
      setCurrentPage('profile');
      setProfileTab('notifications');
      return;
    }

    switch (page) {
      case 'home':
        setCurrentPage('home');
        setSelectedCourseId(null);
        setSelectedLessonId(null);
        break;
      case 'catalog':
        setCurrentPage('catalog');
        setSelectedCourseId(null);
        setSelectedLessonId(null);
        setCatalogSelectedTrack('all');
        break;
      case 'path':
        setCurrentPage('path');
        break;
      case 'courses':
        setCurrentPage('courses');
        break;
      case 'about':
        setCurrentPage('about');
        break;
      case 'profile':
        setCurrentPage('profile');
        setProfileTab('settings');
        break;
      case 'handbook':
        setCurrentPage('handbook');
        break;
      default:
        setCurrentPage('home');
    }
  };

  const openCatalog = (trackId: TrackId | 'all' = 'all') => {
    setCatalogSelectedTrack(trackId);
    setCurrentPage('catalog');
    setSelectedCourseId(null);
    setSelectedLessonId(null);
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage('course');
  };

  const handleBackToCatalog = () => {
    openCatalog('all');
  };

  const handleBackToCourse = () => {
    setCurrentPage('course');
  };

  const handleStartCourse = () => {
    setCurrentPage('lesson');
  };

  const handleSelectLesson = (lessonId: string) => {
    console.log('Selected lesson:', lessonId);
    setSelectedLessonId(lessonId);
    setCurrentPage('lesson');
  };

  const handleOpenMap = () => {
    setCurrentPage('path');
  };

  const selectedCourse = selectedCourseId 
    ? courses.find(c => c.id === selectedCourseId)
    : null;
  const selectedTrack = selectedCourse ? tracks.find(t => t.id === selectedCourse.trackId) : null;

  return (
    <div className="min-h-screen bg-background relative selection:bg-black selection:text-white">
      <SmoothLinesBackground />
      
      <Header 
        currentPage={currentPage === 'profile' ? 'profile' : currentPage} 
        onNavigate={handleNavigate}
      />
      
      <main className="relative z-10">
        {currentPage === 'home' && <HomePage />}

        {currentPage === 'catalog' && (
          <>
            <HeroSection />
            <CourseCatalog
              onCourseSelect={handleCourseSelect}
              selectedTrack={catalogSelectedTrack}
              onSelectedTrackChange={setCatalogSelectedTrack}
            />
          </>
        )}

      {currentPage === 'path' && (
        <KnowledgeGraphPage 
          onNodeClick={(nodeId) => {
            if (nodeId === 'root') return;
            
            // Try to find if it's a course
            const course = courses.find(c => c.id === nodeId);
            if (course) {
              setSelectedCourseId(nodeId);
              setCurrentPage('course');
            } else {
              // Assume it's a lesson or just log for now
              console.log('Node clicked:', nodeId);
              // setSelectedLessonId(nodeId);
              // setCurrentPage('lesson');
            }
          }}
          onOpenHandbook={() => {
            setCurrentPage('handbook');
          }}
        />
      )}

      {currentPage === 'courses' && (
        <MyCoursesPage onCourseSelect={handleCourseSelect} />
      )}

      {currentPage === 'about' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Page title */}
            <div className="relative inline-block">
              <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
                <h1 className="mb-0">О ПЛАТФОРМЕ</h1>
              </div>
              <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
            </div>

            <div className="border-l-4 border-black pl-6">
              <p className="text-foreground font-mono leading-relaxed">
                Образовательная платформа «GRAPH» — это инновационный подход к онлайн-обучению, 
                где процесс освоения знаний визуализирован как путешествие по логическому графу.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
                <h2 className="mb-0">НАШИ ТРЕКИ</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-3 mb-4" style={{ backgroundColor: '#E2B6C8' }} />
                  <h3 className="mb-3 font-mono tracking-wide">ИВЕНТ</h3>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    Организация мероприятий и управление событиями любого масштаба
                  </p>
                </div>
                <div className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-3 mb-4" style={{ backgroundColor: '#B6E2C8' }} />
                  <h3 className="mb-3 font-mono tracking-wide">ЦИФРОВЫЕ ПРОДУКТЫ</h3>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    Product management, аналитика и работа с цифровыми решениями
                  </p>
                </div>
                <div className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-3 mb-4" style={{ backgroundColor: '#B6C8E2' }} />
                  <h3 className="mb-3 font-mono tracking-wide">ВНЕШНИЕ КОММУНИКАЦИИ</h3>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    Деловая коммуникация, PR и работа с общественностью
                  </p>
                </div>
                <div className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-3 mb-4" style={{ backgroundColor: '#C8B6E2' }} />
                  <h3 className="mb-3 font-mono tracking-wide">ДИЗАЙН</h3>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    Графический и продуктовый дизайн, UX/UI интерфейсов
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
                <h2 className="mb-0">КАК ЭТО РАБОТАЕТ</h2>
              </div>
              <div className="space-y-6 font-mono">
                <div className="border-2 border-black p-6 bg-white">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-2 tracking-wide">ВЫБЕРИТЕ ТРЕК И КУРС</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Изучите каталог курсов и выберите направление, которое вас интересует.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-black p-6 bg-white">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-2 tracking-wide">ИССЛЕДУЙТЕ КАРТУ ЗНАНИЙ</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Увидьте структуру курса как логический граф с вершинами-темами и связями между ними.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-black p-6 bg-white">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-2 tracking-wide">ПРОЙДИТЕ УРОКИ</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Смотрите видео, читайте конспекты, работайте с хендбуком и выполняйте задания.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-black p-6 bg-white">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-2 tracking-wide">ПОЛУЧАЙТЕ ОБРАТНУЮ СВЯЗЬ</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Кураторы проверят ваши задания и дадут рекомендации по улучшению.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'profile' && (
        <ProfilePage 
          initialTab={profileTab}
          onNavigateToLesson={(lessonId) => {
            console.log('Navigate to lesson:', lessonId);
            setSelectedLessonId(lessonId);
            setCurrentPage('lesson');
          }}
        />
      )}

      {currentPage === 'course' && selectedCourse && (
        <CoursePage
          course={selectedCourse}
          onBack={handleBackToCatalog}
          onStartCourse={handleStartCourse}
          onOpenMap={handleOpenMap}
          onSelectLesson={handleSelectLesson}
          onOpenHandbook={() => {
            setCurrentPage('handbook');
          }}
        />
      )}

      {currentPage === 'lesson' && (
        <LessonPage
          onBack={handleBackToCourse}
          onGoToCatalog={(trackId) => openCatalog(trackId ?? 'all')}
          trackId={selectedCourse?.trackId}
          trackName={selectedTrack?.name}
          onNavigate={(direction) => {
            console.log('Navigate:', direction);
          }}
          onOpenMap={handleOpenMap}
          onOpenHandbook={() => {
            setCurrentPage('handbook');
          }}
        />
      )}

      {currentPage === 'handbook' && (
        <HandbookPage
          onBack={() => {
            if (selectedCourseId) {
              setCurrentPage('course');
            } else {
              setCurrentPage('path');
            }
          }}
          courseId={selectedCourseId || undefined}
        />
      )}
      </main>
    </div>
  );
}