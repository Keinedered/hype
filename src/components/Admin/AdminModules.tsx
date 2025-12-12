import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { api } from '../../services/api';

const AdminModules: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      loadModules();
    }
  }, [courseId]);

  const loadModules = () => {
    if (!courseId) return;
    api.get(`/modules/course/${courseId}`)
      .then(response => {
        setModules(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading modules:', error);
        setLoading(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      courseId: parseInt(courseId),
      order: parseInt(formData.get('order') as string) || 0
    };

    const promise = editingModule
      ? api.put(`/modules/${editingModule.id}`, data)
      : api.post('/modules', data);

    promise
      .then(() => {
        loadModules();
        setShowForm(false);
        setEditingModule(null);
      })
      .catch(error => {
        console.error('Error saving module:', error);
        alert('Ошибка при сохранении модуля');
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот модуль?')) return;
    
    api.delete(`/modules/${id}`)
      .then(() => loadModules())
      .catch(error => {
        console.error('Error deleting module:', error);
        alert('Ошибка при удалении модуля');
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
          onClick={() => navigate('/admin/courses')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Назад к курсам
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Управление модулями</h1>
        <button
          onClick={() => {
            setEditingModule(null);
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
          + Создать модуль
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
            {editingModule ? 'Редактировать модуль' : 'Создать модуль'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Название модуля *
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingModule?.title}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Описание
              </label>
              <textarea
                name="description"
                defaultValue={editingModule?.description}
                rows={3}
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
                Порядок
              </label>
              <input
                type="number"
                name="order"
                defaultValue={editingModule?.order_index || 0}
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
                {editingModule ? 'Сохранить изменения' : 'Создать модуль'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingModule(null);
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
            {modules.map(module => (
              <tr key={module.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{module.id}</td>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>{module.title}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{module.order_index}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditingModule(module);
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
                      onClick={() => navigate(`/admin/modules/${module.id}/lessons`)}
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
                      Уроки
                    </button>
                    <button
                      onClick={() => handleDelete(module.id)}
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

export default AdminModules;
