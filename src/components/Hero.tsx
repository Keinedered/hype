import React from 'react';

const Hero: React.FC = () => {
  return (
    <section style={{
      backgroundColor: '#f9fafb',
      padding: '80px 0',
      marginBottom: '48px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '48px'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#111827',
            lineHeight: '1.2'
          }}>
            Выстрой свой путь
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Обучение как путешествие по карте знаний. Выбирайте собственный маршрут и осваивайте навыки в удобном темпе.
          </p>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            opacity: 0.1,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '64px'
            }}>
              🗺️
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;