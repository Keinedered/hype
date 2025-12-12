import React, { ReactNode, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Layout from '../Layout';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const user = userContext?.user;

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h2>Доступ запрещен</h2>
          <p>Требуются права администратора</p>
          <button onClick={() => navigate('/')}>Вернуться на главную</button>
        </div>
      </Layout>
    );
  }

  const menuItems = [
    { path: '/admin', label: 'Дашборд', icon: '📊' },
    { path: '/admin/tracks', label: 'Треки', icon: '🎯' },
    { path: '/admin/courses', label: 'Курсы', icon: '📚' },
    { path: '/admin/modules', label: 'Модули', icon: '📑' },
    { path: '/admin/lessons', label: 'Уроки', icon: '🎓' },
    { path: '/admin/assignments', label: 'Задания', icon: '✍️' },
    { path: '/admin/submissions', label: 'Проверка заданий', icon: '✅' },
    { path: '/admin/graph', label: 'Граф знаний', icon: '🗺️' }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '250px',
          backgroundColor: '#1f2937',
          color: '#ffffff',
          padding: '24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '32px' }}>
            Админ-панель
          </h2>
          <nav>
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: location.pathname === item.path ? '#ffffff' : '#d1d5db',
                  backgroundColor: location.pathname === item.path ? '#374151' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #374151' }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#d1d5db'
              }}
            >
              <span>←</span>
              <span>Вернуться на сайт</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px', backgroundColor: '#f9fafb' }}>
          {children}
        </main>
      </div>
    </Layout>
  );
};

export default AdminLayout;
