import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { api } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(response => {
        setStats(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div>Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
        Дашборд
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Всего пользователей
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb' }}>
            {stats?.totalUsers || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Всего курсов
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
            {stats?.totalCourses || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Заданий на проверке
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {stats?.pendingSubmissions || 0}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Активных студентов
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#8b5cf6' }}>
            {stats?.activeStudents || 0}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
