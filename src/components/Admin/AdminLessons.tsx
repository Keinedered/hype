import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { api } from '../../services/api';

const AdminLessons: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  useEffect(() => {
    if (moduleId) {
      loadData();
    }
  }, [moduleId]);

  const loadData = () => {
    if (!moduleId) return;
    
    api.get(`/modules/${moduleId}`)
      .then(moduleRes => {
        setModule(moduleRes.data);
        // Get lessons for the course, then filter by module
        return api.get(`/lessons/course/${moduleRes.data.course_id}`);
      })
      .then(lessonsRes => {
        // Filter lessons by module
        const moduleLessons = lessonsRes.data.filter((l: any) => l.module_id === parseInt(moduleId));
        setLessons(moduleLessons);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !module) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      moduleId: parseInt(moduleId),
      courseId: module.course_id,
      order: parseInt(formData.get('order') as string) || 0,
      videoUrl: formData.get('videoUrl'),
      videoDuration: formData.get('videoDuration') ? parseInt(formData.get('videoDuration') as string) : null,
      transcript: formData.get('transcript'),
      assignmentId: formData.get('assignmentId') ? parseInt(formData.get('assignmentId') as string) : null
    };

    const promise = editingLesson
      ? api.put(`/lessons/${editingLesson.id}`, data)
      : api.post('/lessons', data);

    promise
      .then(() => {
        loadData();
        setShowForm(false);
        setEditingLesson(null);
      })
      .catch(error => {
        console.error('Error saving lesson:', error);
        alert('Ошибка при сохранении урока');
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) return;
    
    api.delete(`/lessons/${id}`)
      .then(() => loadData())
      .catch(error => {
        console.error('Error deleting lesson:', error);
        alert('Ошибка при удалении урока');
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
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => module && navigate(`/admin/courses/${module.course_id}/modules`)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Назад к модулям
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>
          Управление уроками {module && `(Модуль: ${module.title})`}
        </h1>
        <button
          onClick={() => {
            setEditingLesson(null);
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
          + Создать урок
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
            {editingLesson ? 'Редактировать урок' : 'Создать урок'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Название урока *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingLesson?.title}
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
                  Порядок
                </label>
                <input
                  type="number"
                  name="order"
                  defaultValue={editingLesson?.order_index || 0}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Описание
              </label>
              <textarea
                name="description"
                defaultValue={editingLesson?.description}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  URL видео
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  defaultValue={editingLesson?.video_url}
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
                  Длительность (секунды)
                </label>
                <input
                  type="number"
                  name="videoDuration"
                  defaultValue={editingLesson?.video_duration}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Конспект/Транскрипт
              </label>
              <textarea
                name="transcript"
                defaultValue={editingLesson?.transcript}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                ID задания (опционально)
              </label>
              <input
                type="number"
                name="assignmentId"
                defaultValue={editingLesson?.assignment_id}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
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
                {editingLesson ? 'Сохранить изменения' : 'Создать урок'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingLesson(null);
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
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Порядок</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map(lesson => (
              <tr key={lesson.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{lesson.id}</td>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>{lesson.title}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{lesson.order_index}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
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
                      onClick={() => handleDelete(lesson.id)}
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

export default AdminLessons;
