import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { HeroSection } from './components/HeroSection';
import { CourseCatalog } from './components/CourseCatalog';
import { CoursePage } from './components/CoursePage';
import { LessonPage } from './components/LessonPage';
import { MyCoursesPage } from './components/MyCoursesPage';
import { KnowledgeGraphPage } from './components/KnowledgeGraphPage';
import { HandbookPage } from './components/HandbookPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProfilePage } from './components/ProfilePage';
import { AdminPage } from './components/AdminPage';
import { useAuth } from './context/AuthContext';
import { SmoothLinesBackground } from './components/ui/SmoothLinesBackground';
import { Track, TrackId } from './types';
import { tracksAPI } from './api/client';
import { normalizeTrack } from './api/normalizers';

type Page = 'home' | 'catalog' | 'path' | 'courses' | 'about' | 'profile' | 'admin' | 'course' | 'lesson' | 'handbook' | 'login';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [catalogSelectedTrack, setCatalogSelectedTrack] = useState<TrackId | 'all'>('all');
  const [aboutTracks, setAboutTracks] = useState<Track[]>([]);
  const [aboutTracksLoading, setAboutTracksLoading] = useState(true);
  const [aboutTracksError, setAboutTracksError] = useState<string | null>(null);

  const { isAuthenticated, loading: authLoading, user } = useAuth();
  useEffect(() => {
    let cancelled = false;
    const loadTracks = async () => {
      setAboutTracksLoading(true);
      setAboutTracksError(null);
      try {
        const rawTracks = await tracksAPI.getAll();
        if (!cancelled) {
          setAboutTracks(rawTracks.map(normalizeTrack));
        }
      } catch (error) {
        if (!cancelled) {
          setAboutTracksError('Не удалось загрузить треки.');
          setAboutTracks([]);
        }
      } finally {
        if (!cancelled) {
          setAboutTracksLoading(false);
        }
      }
    };
    void loadTracks();
    return () => {
      cancelled = true;
    };
  }, []);
  const pushPath = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const applyPathFromLocation = (pathname: string) => {
    if (pathname === '/login') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('login');
      return;
    }

    if (pathname === '/profile') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('profile');
      return;
    }

    if (pathname === '/admin') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('admin');
      return;
    }

    if (pathname.startsWith('/course/')) {
      const courseId = pathname.split('/')[2] ?? '';
      setSelectedCourseId(courseId);
      setSelectedLessonId(null);
      setCurrentPage('course');
      return;
    }

    if (pathname === '/course') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('course');
      return;
    }

    if (pathname.startsWith('/lesson/')) {
      const lessonId = pathname.split('/')[2] ?? '';
      setSelectedLessonId(lessonId);
      setCurrentPage('lesson');
      return;
    }

    if (pathname === '/lesson') {
      setSelectedLessonId(null);
      setCurrentPage('lesson');
      return;
    }

    if (pathname.startsWith('/handbook/')) {
      const courseId = pathname.split('/')[2] ?? '';
      setSelectedCourseId(courseId || null);
      setCurrentPage('handbook');
      return;
    }

    if (pathname === '/handbook') {
      setCurrentPage('handbook');
      return;
    }

    setSelectedCourseId(null);
    setSelectedLessonId(null);
    setCatalogSelectedTrack('all');
    setCurrentPage('home');
  };

  useEffect(() => {
    applyPathFromLocation(window.location.pathname);
    const handlePopState = () => {
      applyPathFromLocation(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string) => {
    const normalized = page.split('?')[0];

    if (normalized.startsWith('course/')) {
      const courseId = normalized.split('/')[1] ?? '';
      setSelectedCourseId(courseId);
      setSelectedLessonId(null);
      setCurrentPage('course');
      pushPath(`/course/${courseId}`);
      return;
    }

    if (normalized === 'course') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('course');
      pushPath('/course');
      return;
    }

    if (normalized.startsWith('lesson/')) {
      const lessonId = normalized.split('/')[1] ?? '';
      setSelectedLessonId(lessonId);
      setCurrentPage('lesson');
      pushPath(`/lesson/${lessonId}`);
      return;
    }

    if (normalized === 'lesson') {
      setSelectedLessonId(null);
      setCurrentPage('lesson');
      pushPath('/lesson');
      return;
    }

    if (normalized.startsWith('handbook/')) {
      const courseId = normalized.split('/')[1] ?? '';
      setSelectedCourseId(courseId || null);
      setCurrentPage('handbook');
      pushPath(`/handbook/${courseId}`);
      return;
    }

    if (normalized === 'handbook') {
      setCurrentPage('handbook');
      pushPath('/handbook');
      return;
    }

    if (normalized === 'login') {
      setCurrentPage('login');
      pushPath('/login');
      return;
    }

    if (normalized === 'profile-notifications') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('profile');
      pushPath('/profile');
      return;
    }

    if (normalized === 'profile') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('profile');
      pushPath('/profile');
      return;
    }

    if (normalized === 'admin') {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setCurrentPage('admin');
      pushPath('/admin');
      return;
    }

    switch (normalized) {
      case 'home':
        setSelectedCourseId(null);
        setSelectedLessonId(null);
        setCatalogSelectedTrack('all');
        setCurrentPage('home');
        break;
      case 'catalog':
        setSelectedCourseId(null);
        setSelectedLessonId(null);
        setCatalogSelectedTrack('all');
        setCurrentPage('catalog');
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
      default:
        setSelectedCourseId(null);
        setSelectedLessonId(null);
        setCurrentPage('home');
    }

    pushPath('/');
  };

  const openCatalog = (trackId: TrackId | 'all' = 'all') => {
    setCatalogSelectedTrack(trackId);
    setCurrentPage('catalog');
    setSelectedCourseId(null);
    setSelectedLessonId(null);
    pushPath('/');
  };

  const handleCourseSelect = (courseId: string) => {
    handleNavigate(`course/${courseId}`);
  };

  const handleBackToCatalog = () => {
    openCatalog('all');
  };

  const handleBackToCourse = () => {
    if (selectedCourseId) {
      handleNavigate(`course/${selectedCourseId}`);
    } else {
      handleNavigate('course');
    }
  };

  const handleStartCourse = () => {
    handleNavigate('lesson');
  };

  const handleSelectLesson = (lessonId: string) => {
    if (!lessonId) return;
    handleNavigate(`lesson/${lessonId.split('?')[0]}`);
  };

  const handleOpenMap = () => {
    handleNavigate('path');
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-black selection:text-white">
      <SmoothLinesBackground />

      <Header
        currentPage={currentPage === 'profile' ? 'profile' : currentPage}
        onNavigate={handleNavigate}
      />

      <main className="relative z-10">
        {currentPage === 'login' && (
          <LoginPage onAuthSuccess={() => handleNavigate('profile')} />
        )}

        {currentPage === 'home' && <HomePage onOpenProfile={() => handleNavigate(isAuthenticated ? 'profile' : 'login')} />}

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
            handleNavigate(`course/${nodeId}`);
          }}
          onOpenHandbook={() => {
            if (selectedCourseId) {
              handleNavigate(`handbook/${selectedCourseId}`);
            } else {
              handleNavigate('handbook');
            }
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
              {aboutTracksLoading ? (
                <p className="font-mono text-sm uppercase text-muted-foreground">Загрузка треков...</p>
              ) : aboutTracksError ? (
                <p className="font-mono text-sm text-red-600">{aboutTracksError}</p>
              ) : aboutTracks.length === 0 ? (
                <p className="font-mono text-sm uppercase text-muted-foreground">Треки не найдены.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {aboutTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300"
                    >
                      <div className="h-3 mb-4" style={{ backgroundColor: track.color || '#000' }} />
                      <h3 className="mb-3 font-mono tracking-wide">{track.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                        {track.description || 'Описание скоро появится.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
        <ProtectedRoute
          isAuthenticated={isAuthenticated}
          isAuthLoading={authLoading}
          onUnauthorized={() => handleNavigate('login')}
          fallback={null}
        >
          <ProfilePage onUnauthorized={() => handleNavigate('login')} onNavigateToLesson={(lessonId) => handleNavigate(`lesson/${lessonId}`)} />
        </ProtectedRoute>
      )}

      {currentPage === 'admin' && (
        <ProtectedRoute
          isAuthenticated={isAuthenticated}
          isAuthLoading={authLoading}
          userRole={user?.role}
          requireRole={['admin', 'course_editor']}
          onUnauthorized={() => handleNavigate('login')}
          onForbidden={() => handleNavigate('profile')}
          fallback={null}
        >
          <AdminPage />
        </ProtectedRoute>
      )}

      {currentPage === 'course' && selectedCourseId && (
        <CoursePage
          courseId={selectedCourseId}
          onBack={handleBackToCatalog}
          onStartCourse={handleStartCourse}
          onOpenMap={handleOpenMap}
          onSelectLesson={handleSelectLesson}
          onOpenHandbook={() => {
            if (selectedCourseId) {
              handleNavigate(`handbook/${selectedCourseId}`);
            } else {
              handleNavigate('handbook');
            }
          }}
        />
      )}

      {currentPage === 'lesson' && (
        <LessonPage
          onBack={handleBackToCourse}
          onGoToCatalog={(trackId) => openCatalog(trackId ?? 'all')}
          lessonId={selectedLessonId || undefined}
          onSelectLesson={handleSelectLesson}
          onNavigate={(direction) => {
            console.log('Navigate:', direction);
          }}
          onOpenMap={handleOpenMap}
          onOpenHandbook={() => {
            if (selectedCourseId) {
              handleNavigate(`handbook/${selectedCourseId}`);
            } else {
              handleNavigate('handbook');
            }
          }}
        />
      )}
      {/* #region agent log */}
      {currentPage === 'lesson' && (() => {
        fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:319',message:'LessonPage rendered',data:{selectedLessonId, selectedCourseId, hasLessonId:!!selectedLessonId, lessonIdPassed:!!selectedLessonId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}

      {currentPage === 'handbook' && (
        <HandbookPage
          onBack={() => {
            if (selectedCourseId) {
              handleNavigate(`course/${selectedCourseId}`);
            } else {
              handleNavigate('path');
            }
          }}
          courseId={selectedCourseId || undefined}
        />
      )}
      </main>
    </div>
  );
}
