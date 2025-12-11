import React from 'react';

const Hero: React.FC = () => {
  return (
    <section style={{
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: '32px 0',
      marginBottom: '24px'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 16px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          Выстрой свой путь
        </h2>
        <p>Выберите курс и начните обучение прямо сейчас</p>
      </div>
    </section>
  );
};

export default Hero;