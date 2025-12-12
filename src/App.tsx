import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ProgressContext } from './context/ProgressContext';
import { courses } from './mock/courses';
import { tracks } from './mock/tracks';
import { api } from './services/api';
import Layout from './components/Layout';
import Header from './components/Header';
import Hero from './components/Hero';
import TrackFilterBar from './components/TrackFilterBar';
import CourseCard from './components/CourseCard';
import CourseDetail from './components/CourseDetail';
import LessonDetail from './components/LessonDetail';
import MyCourses from './components/MyCourses';
import MyPath from './components/MyPath';
import AssignmentHistory from './components/AssignmentHistory';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminCourses from './components/Admin/AdminCourses';
import AdminSubmissions from './components/Admin/AdminSubmissions';
import AdminModules from './components/Admin/AdminModules';
import AdminLessons from './components/Admin/AdminLessons';

const initialProgress: Record<number, number> = {
  1: 50,
  2: 0,
  3: 30,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0
};

const HomePage: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [tracksData, setTracksData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/tracks')
    ]).then(([coursesRes, tracksRes]) => {
      setCoursesData(coursesRes.data);
      setTracksData(tracksRes.data);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      // Fallback to mock data
      setCoursesData(courses);
      setTracksData(tracks);
      setLoading(false);
    });
  }, []);

  const filteredCourses = selectedTrackId === null
    ? coursesData
    : coursesData.filter((c: any) => c.track_id === selectedTrackId);

  return (
    <>
      <Hero />
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px 24px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Загрузка...</div>
        ) : (
          <>
            <TrackFilterBar
              tracks={tracksData}
              selectedTrackId={selectedTrackId}
              onSelect={setSelectedTrackId}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginTop: '32px'
            }}>
              {filteredCourses.map((course: any) => {
                const track = tracksData.find((t: any) => t.id === course.track_id);
                return (
                  <CourseCard key={course.id} course={course} track={track} />
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [progress] = useState(initialProgress);

  return (
    <UserProvider>
      <ProgressContext.Provider value={progress}>
        <Router>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Header />
                <HomePage />
              </Layout>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<LessonDetail />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-path" element={<MyPath />} />
            <Route path="/assignment-history" element={<AssignmentHistory />} />
            <Route path="/about" element={
              <Layout>
                <Header />
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
                  <h1>О платформе</h1>
                  <p>Платформа для обучения с визуализацией знаний в виде графа</p>
                </div>
              </Layout>
            } />
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/:courseId/modules" element={<AdminModules />} />
            <Route path="/admin/modules/:moduleId/lessons" element={<AdminLessons />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
          </Routes>
        </Router>
      </ProgressContext.Provider>
    </UserProvider>
  );
};

export default App;