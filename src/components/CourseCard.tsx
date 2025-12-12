import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressContext } from '../context/ProgressContext';
import ProgressBar from './ProgressBar';

interface CourseCardProps {
  course: any;
  track?: any;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
const Card: React.FC<CourseCardProps> = ({ course, track }) => {
  const progress = useContext(ProgressContext)[course.id] ?? 0;
  const navigate = useNavigate();
  const trackColor = track?.color || '#e5e7eb';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: '#000000' }}>
    <div
      onClick={() => navigate(`/course/${course.id}`)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        borderTop: `4px solid ${trackColor}`,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
        {course.version || 'v1.0'}
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
        {course.title}
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
        {course.description}
      </p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
        {course.module_count && (
          <span>📚 {course.module_count} модулей</span>
        )}
        {course.lesson_count && (
          <span>🎥 {course.lesson_count} уроков</span>
        )}
      </div>
      {progress > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <ProgressBar percent={progress} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: trackColor + '20',
          color: trackColor,
          fontSize: '12px',
          fontWeight: 600
        }}>
          {track?.title || 'Курс'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/course/${course.id}`);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: trackColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
};

export default CourseCard;