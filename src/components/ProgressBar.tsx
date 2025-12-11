import React from 'react';

interface ProgressBarProps {
  percent: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent }) => {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div style={{
        width: '100%',
        backgroundColor: '#e5e7eb',
        borderRadius: '9999px',
        height: '8px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            width: `${safe}%`,
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: '#22c55e',
            transition: 'width 0.2s ease-out'
          }}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', textAlign: 'right' }}>
        {safe}% выполнено
      </div>
    </div>
  );
};

export default ProgressBar;