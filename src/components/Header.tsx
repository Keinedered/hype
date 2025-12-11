import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

const Header: React.FC = () => {
  const user = useContext(UserContext);

  return (
    <header style={{
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '12px 0',
      marginBottom: '24px'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>EdTech Платформа</h1>
        <div>
          {user ? (
            <span>Привет, {user.name}!</span>
          ) : (
            <button>Войти</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;