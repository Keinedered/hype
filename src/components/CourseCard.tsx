import React, { useContext } from 'react';
import { Course } from '../types/Course';
import { ProgressContext } from '../context/ProgressContext';
import ProgressBar from './ProgressBar';

interface CourseCardProps {
  course: Course;
}

const Card: React.FC<CourseCardProps> = ({ course }) => {
  const progress = useContext(ProgressContext)[course.id] ?? 0;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
        {course.title}
      </h3>
      <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
        {course.description}
      </p>
      <div style={{ marginBottom: '8px' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '9999px',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
          fontSize: '12px'
        }}>
          {course.track}
        </span>
      </div>
      <ProgressBar percent={progress} />
    </div>
  );
};

export default Card;