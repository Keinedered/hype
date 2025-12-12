import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const Header: React.FC = () => {
  const userContext = useContext(UserContext);
  const user = userContext?.user;
  const navigate = useNavigate();

  return (
    <header style={{
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '12px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '0'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '72px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Курсы
            </h1>
          </Link>
          <nav style={{ display: 'flex', gap: '24px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>
              Каталог
            </Link>
            <Link to="/my-path" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>
              Мой путь
            </Link>
            <Link to="/my-courses" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>
              Мои курсы
            </Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px' }}>
              О платформе
            </Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <button
                onClick={() => navigate('/notifications')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '8px'
                }}
              >
                🔔
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  3
                </span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#8b5cf6',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    Админ-панель
                  </Link>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: '14px' }}>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Войти
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;