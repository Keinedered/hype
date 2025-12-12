import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SubmissionStatus } from '../types/Assignment';
import Layout from './Layout';
import Header from './Header';

const LessonDetail: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [textAnswer, setTextAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [track, setTrack] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [latestSubmission, setLatestSubmission] = useState<any>(null);
  const [allCourseLessons, setAllCourseLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const lessonIdNum = lessonId ? parseInt(lessonId, 10) : null;
  const courseIdNum = courseId ? parseInt(courseId, 10) : null;
  const submissionStatus: SubmissionStatus = latestSubmission?.status || 'not-submitted';
  
  useEffect(() => {
    if (!lessonIdNum || !courseIdNum) return;

    Promise.all([
      api.get(`/lessons/${lessonIdNum}`),
      api.get(`/courses/${courseIdNum}`),
      api.get(`/lessons/course/${courseIdNum}`)
    ]).then(([lessonRes, courseRes, lessonsRes]) => {
      setLesson(lessonRes.data);
      setCourse(courseRes.data);
      setTrack({ id: courseRes.data.track_id, title: courseRes.data.track_title, color: courseRes.data.track_color });
      
      if (lessonRes.data.module_id) {
        api.get(`/modules/${lessonRes.data.module_id}`)
          .then(moduleRes => setModule(moduleRes.data));
      }

      if (lessonRes.data.assignment_id) {
        api.get(`/assignments/lesson/${lessonIdNum}`)
          .then(assignmentRes => {
            setAssignment(assignmentRes.data);
            return api.get('/submissions/my');
          })
          .then(submissionsRes => {
            const userSubmissions = submissionsRes.data.filter((s: any) => s.assignment_id === lessonRes.data.assignment_id);
            if (userSubmissions.length > 0) {
              setLatestSubmission(userSubmissions[userSubmissions.length - 1]);
            }
          });
      }

      const sortedLessons = lessonsRes.data.sort((a: any, b: any) => {
        if (a.module_id !== b.module_id) return a.module_id - b.module_id;
        return a.order_index - b.order_index;
      });
      setAllCourseLessons(sortedLessons);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading lesson:', error);
      setLoading(false);
    });
  }, [lessonIdNum, courseIdNum]);

  const currentIndex = allCourseLessons.findIndex((l: any) => l.id === lessonIdNum);
  const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <Layout>
        <Header />
        <div style={{ padding: '32px', textAlign: 'center' }}>Загрузка...</div>
      </Layout>
    );
  }

  if (!lesson || !course) {
    return (
      <Layout>
        <Header />
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h2>Занятие не найдено</h2>
          <button
            onClick={() => navigate(courseIdNum ? `/course/${courseIdNum}` : '/')}
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
            Вернуться
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '24px', fontSize: '14px', color: '#6b7280' }}>
          <span
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Каталог
          </span>
          {' > '}
          <span
            onClick={() => navigate(`/course/${courseId}`)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {track?.title}
          </span>
          {' > '}
          <span
            onClick={() => navigate(`/course/${courseId}`)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {course?.title}
          </span>
          {module && (
            <>
              {' > '}
              <span>{module.title}</span>
            </>
          )}
          {' > '}
          <span style={{ fontWeight: 600 }}>{lesson.title}</span>
        </div>

        {/* Заголовок урока */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: track?.color + '20' || '#dbeafe',
              color: track?.color || '#1d4ed8',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              {track?.title}
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            {lesson.title}
          </h1>
          {lesson.description && (
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
              {lesson.description}
            </p>
          )}
          {lesson.videoDuration && (
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              Длительность: {Math.floor(lesson.videoDuration / 60)} мин
            </p>
          )}
        </div>

        {/* Двухколоночный макет */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Левая колонка - Основной контент */}
          <div>
            {/* Видео-плеер */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                Видео-урок
              </h2>
              {lesson.video_url ? (
                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: '8px',
                  backgroundColor: '#000000'
                }}>
                <iframe
                  src={lesson.video_url}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#6b7280'
                }}>
                  <p>Видео-урок будет доступен в ближайшее время</p>
                </div>
              )}
            </div>

            {/* Конспект */}
            {lesson.transcript && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                  Конспект
                </h2>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {lesson.transcript}
                </div>
              </div>
            )}

            {/* Хендбук */}
            {lesson.handbook_excerpts && lesson.handbook_excerpts.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                  Из хендбука
                </h2>
                {lesson.handbook_excerpts.map((excerpt: any) => (
                  <div key={excerpt.id} style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                      {excerpt.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                      {excerpt.text}
                    </p>
                    <button
                      onClick={() => {/* Открыть хендбук */}}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Читать в хендбуке →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Задание */}
            {assignment && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                  Задание к уроку
                </h2>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    {assignment.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '12px' }}>
                    {assignment.description}
                  </p>
                  {assignment.criteria && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      marginBottom: '16px'
                    }}>
                      <strong style={{ fontSize: '14px' }}>Критерии оценки:</strong>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        {assignment.criteria}
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!assignment) return;

                  try {
                    await api.post('/submissions', {
                      assignmentId: assignment.id,
                      textAnswer: textAnswer || undefined,
                      linkUrl: linkUrl || undefined,
                      fileUrls: [] // TODO: implement file upload
                    });
                    alert('Задание отправлено на проверку!');
                    // Reload lesson data
                    window.location.reload();
                  } catch (error: any) {
                    alert(error.response?.data?.error || 'Ошибка при отправке задания');
                  }
                }}>
                  {assignment.accepts_text && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Текстовый ответ:
                      </label>
                      <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Введите ваш ответ..."
                      />
                    </div>
                  )}

                  {assignment.accepts_link && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Ссылка на решение:
                      </label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  {assignment.accepts_file && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                        Прикрепить файл:
                      </label>
                      <input
                        type="file"
                        accept={assignment.allowed_file_types ? JSON.parse(assignment.allowed_file_types).join(',') : undefined}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      {assignment.allowed_file_types && (
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Разрешённые форматы: {JSON.parse(assignment.allowed_file_types).join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submissionStatus === 'pending' || submissionStatus === 'accepted'}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      backgroundColor: submissionStatus === 'accepted' ? '#10b981' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: submissionStatus === 'pending' || submissionStatus === 'accepted' ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 600,
                      opacity: submissionStatus === 'pending' || submissionStatus === 'accepted' ? 0.6 : 1
                    }}
                  >
                    {submissionStatus === 'pending' ? 'Отправлено на проверку' : 
                     submissionStatus === 'accepted' ? 'Задание принято' : 
                     'Отправить на проверку'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Правая колонка - Статус и навигация */}
          <div>
            {/* Статус задания */}
            {latestSubmission && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Статус задания
                </h3>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor:
                    latestSubmission.status === 'accepted' ? '#d1fae5' :
                    latestSubmission.status === 'needs-revision' ? '#fee2e2' :
                    latestSubmission.status === 'pending' ? '#dbeafe' : '#f3f4f6',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color:
                      latestSubmission.status === 'accepted' ? '#065f46' :
                      latestSubmission.status === 'needs-revision' ? '#991b1b' :
                      latestSubmission.status === 'pending' ? '#1e40af' : '#374151'
                  }}>
                    {latestSubmission.status === 'accepted' ? '✓ Принято' :
                     latestSubmission.status === 'needs-revision' ? '✗ Нужна доработка' :
                     latestSubmission.status === 'pending' ? '⏳ На проверке' : 'Не отправлено'}
                  </div>
                </div>
                {latestSubmission.curatorComment && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginTop: '12px'
                  }}>
                    <strong style={{ fontSize: '12px', color: '#6b7280' }}>Комментарий куратора:</strong>
                    <p style={{ fontSize: '14px', color: '#374151', marginTop: '8px' }}>
                      {latestSubmission.curatorComment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Навигация */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Навигация
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {prevLesson && (
                  <button
                    onClick={() => navigate(`/course/${courseId}/lesson/${prevLesson.id}`)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px'
                    }}
                  >
                    ← Предыдущий урок
                  </button>
                )}
                {nextLesson && (
                  <button
                    onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px'
                    }}
                  >
                    Следующий урок →
                  </button>
                )}
                <button
                  onClick={() => navigate(`/my-path?course=${courseId}`)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Показать на карте
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LessonDetail;
