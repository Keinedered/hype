import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressContext } from '../context/ProgressContext';
import { api } from '../services/api';
import ProgressBar from './ProgressBar';
import Layout from './Layout';
import Header from './Header';

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const progress = useContext(ProgressContext);
  const [courses, setCourses] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/tracks')
    ]).then(([coursesRes, tracksRes]) => {
      setCourses(coursesRes.data);
      setTracks(tracksRes.data);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading courses:', error);
      setLoading(false);
    });
  }, []);

  // Фильтруем курсы, в которых есть прогресс
  const myCourses = courses.filter((c: any) => progress[c.id] !== undefined && progress[c.id] > 0);

  if (loading) {
    return (
      <Layout>
        <Header />
        <div style={{ padding: '32px', textAlign: 'center' }}>Загрузка...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
          Мои курсы
        </h1>
        
        {myCourses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
              Вы ещё не начали ни одного курса
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {myCourses.map((course: any) => {
              const track = tracks.find((t: any) => t.id === course.track_id);
              const courseProgress = progress[course.id] || 0;
              
              return (
                <div
                  key={course.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderTop: `4px solid ${track?.color || '#e5e7eb'}`
                  }}
                >
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                    {course.title}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                    {course.description}
                  </p>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Прогресс</span>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{courseProgress}%</span>
                    </div>
                    <ProgressBar percent={courseProgress} />
                  </div>
                  <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: track?.color || '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    Продолжить
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyCourses;
