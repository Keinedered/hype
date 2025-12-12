import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { api } from '../../services/api';
import { Track } from '../../types/Track';

const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      api.get('/courses'),
      api.get('/tracks')
    ]).then(([coursesRes, tracksRes]) => {
      setCourses(coursesRes.data);
      setTracks(tracksRes.data);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      extendedDescription: formData.get('extendedDescription'),
      trackId: parseInt(formData.get('trackId') as string),
      version: formData.get('version') || 'v1.0',
      level: formData.get('level') || 'beginner',
      goals: formData.get('goals')?.toString().split('\n').filter(Boolean) || [],
      targetAudience: formData.get('targetAudience'),
      results: formData.get('results')?.toString().split('\n').filter(Boolean) || [],
      authors: formData.get('authors')?.toString().split(',').map(a => a.trim()) || [],
      moduleCount: parseInt(formData.get('moduleCount') as string) || 0,
      lessonCount: parseInt(formData.get('lessonCount') as string) || 0
    };

    const promise = editingCourse
      ? api.put(`/courses/${editingCourse.id}`, data)
      : api.post('/courses', data);

    promise
      .then(() => {
        loadData();
        setShowForm(false);
        setEditingCourse(null);
      })
      .catch(error => {
        console.error('Error saving course:', error);
        alert('Ошибка при сохранении курса');
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;
    
    api.delete(`/courses/${id}`)
      .then(() => loadData())
      .catch(error => {
        console.error('Error deleting course:', error);
        alert('Ошибка при удалении курса');
      });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div>Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Управление курсами</h1>
        <button
          onClick={() => {
            setEditingCourse(null);
            setShowForm(true);
          }}
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
          + Создать курс
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
            {editingCourse ? 'Редактировать курс' : 'Создать курс'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Название курса *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingCourse?.title}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Трек *
                </label>
                <select
                  name="trackId"
                  defaultValue={editingCourse?.track_id}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {tracks.map(track => (
                    <option key={track.id} value={track.id}>{track.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Краткое описание
              </label>
              <textarea
                name="description"
                defaultValue={editingCourse?.description}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Расширенное описание
              </label>
              <textarea
                name="extendedDescription"
                defaultValue={editingCourse?.extended_description}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Версия
                </label>
                <input
                  type="text"
                  name="version"
                  defaultValue={editingCourse?.version || 'v1.0'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Уровень
                </label>
                <select
                  name="level"
                  defaultValue={editingCourse?.level || 'beginner'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="beginner">Начальный</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Для кого
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  defaultValue={editingCourse?.target_audience}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Цели обучения (каждая с новой строки)
                </label>
                <textarea
                  name="goals"
                  defaultValue={editingCourse?.goals ? JSON.parse(editingCourse.goals).join('\n') : ''}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Результаты (каждая с новой строки)
                </label>
                <textarea
                  name="results"
                  defaultValue={editingCourse?.results ? JSON.parse(editingCourse.results).join('\n') : ''}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Авторы (через запятую)
                </label>
                <input
                  type="text"
                  name="authors"
                  defaultValue={editingCourse?.authors ? JSON.parse(editingCourse.authors).join(', ') : ''}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Количество модулей
                </label>
                <input
                  type="number"
                  name="moduleCount"
                  defaultValue={editingCourse?.module_count || 0}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Количество уроков
                </label>
                <input
                  type="number"
                  name="lessonCount"
                  defaultValue={editingCourse?.lesson_count || 0}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                {editingCourse ? 'Сохранить изменения' : 'Создать курс'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Название</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Трек</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Версия</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{course.id}</td>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>{course.title}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{course.track_title}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{course.version}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setShowForm(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}/modules`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Модули
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
