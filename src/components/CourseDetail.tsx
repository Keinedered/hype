import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import KnowledgeGraph from './KnowledgeGraph';
import Layout from './Layout';
import Header from './Header';
import ProgressBar from './ProgressBar';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [course, setCourse] = useState<any>(null);
  const [track, setTrack] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const courseId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!courseId) return;

    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/modules/course/${courseId}`),
      api.get(`/lessons/course/${courseId}`)
    ]).then(([courseRes, modulesRes, lessonsRes]) => {
      setCourse(courseRes.data);
      setTrack({ id: courseRes.data.track_id, title: courseRes.data.track_title, color: courseRes.data.track_color });
      setModules(modulesRes.data.sort((a: any, b: any) => a.order_index - b.order_index));
      setLessons(lessonsRes.data);
      
      // Try to load graph data, but don't fail if it's not available
      api.get(`/graph/course/${courseId}`)
        .then(graphRes => {
          setGraphData(graphRes.data);
        })
        .catch(() => {
          // Graph data is optional, set to null if not available
          setGraphData(null);
        });
      
      setLoading(false);
    }).catch(error => {
      console.error('Error loading course:', error);
      setLoading(false);
    });
  }, [courseId]);

  if (loading) {
    return (
      <Layout>
        <Header />
        <div style={{ padding: '32px', textAlign: 'center' }}>Загрузка...</div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <Header />
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h2>Курс не найден</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Вернуться к курсам
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '24px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Назад к курсам
        </button>
        {/* Верхний блок с информацией о курсе */}
        <div style={{
          backgroundColor: track?.color || '#f3f4f6',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          color: '#ffffff'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              {track?.title} • {course.version}
            </span>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px' }}>
            {course.title}
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '24px', opacity: 0.9 }}>
            {course.description}
          </p>
          {course.goals && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Цели обучения:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(typeof course.goals === 'string' ? JSON.parse(course.goals) : course.goals).map((goal: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '8px', fontSize: '14px' }}>
                    ✓ {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const firstLesson = lessons[0];
                if (firstLesson) {
                  navigate(`/course/${courseId}/lesson/${firstLesson.id}`);
                }
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                color: track?.color || '#111827',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Перейти к обучению
            </button>
            <button
              onClick={() => navigate(`/my-path?course=${courseId}`)}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Открыть карту
            </button>
          </div>
        </div>

        {/* Двухколоночный макет */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Левая колонка - Структура курса */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>
              Модули и уроки
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => navigate(`/my-path?course=${courseId}`)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Открыть карту →
              </button>
            </div>
            <div>
              {modules.map((module: any) => {
                const moduleLessons = lessons
                  .filter((l: any) => l.module_id === module.id)
                  .sort((a: any, b: any) => a.order_index - b.order_index);
                const isExpanded = expandedModules.has(module.id);
                
                return (
                  <div key={module.id} style={{ marginBottom: '12px' }}>
                    <div
                      onClick={() => {
                        const newExpanded = new Set(expandedModules);
                        if (isExpanded) {
                          newExpanded.delete(module.id);
                        } else {
                          newExpanded.add(module.id);
                        }
                        setExpandedModules(newExpanded);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {module.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {moduleLessons.length} уроков
                        </div>
                      </div>
                      <span>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: '8px', paddingLeft: '16px' }}>
                        {moduleLessons.map((lesson: any) => (
                          <div
                            key={lesson.id}
                            onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                            style={{
                              padding: '8px 12px',
                              marginBottom: '4px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            {lesson.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Правая колонка - Описание */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>
              О курсе
            </h2>
          {course.extended_description && (
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '24px' }}>
              {course.extended_description}
            </p>
          )}
          {course.target_audience && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Для кого:</h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>{course.target_audience}</p>
            </div>
          )}
          {course.results && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Что вы получите:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(typeof course.results === 'string' ? JSON.parse(course.results) : course.results).map((result: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                    • {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.authors && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Авторы:</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(typeof course.authors === 'string' ? JSON.parse(course.authors) : course.authors).map((author: string, idx: number) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    {author}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Граф знаний */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: '800px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
            Карта знаний курса
          </h2>
          {courseId && graphData && (
            <KnowledgeGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              courseId={courseId}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;
