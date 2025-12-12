import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import KnowledgeGraph from './KnowledgeGraph';
import Layout from './Layout';
import Header from './Header';

const MyPath: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('course');
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null;
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      api.get(`/graph/course/${courseId}`)
        .then(response => {
          setGraphData(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading graph:', error);
          setLoading(false);
        });
    } else {
      // Load all courses graph or show message
      setLoading(false);
    }
  }, [courseId]);

  return (
    <Layout>
      <Header />
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Мой путь
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
          Выстрой свой путь по карте знаний
        </p>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Загрузка...</div>
        ) : !courseId ? (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '48px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
              Выберите курс, чтобы увидеть его граф знаний
            </p>
          </div>
        ) : graphData ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            minHeight: '800px'
          }}>
            <KnowledgeGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              courseId={courseId}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            Граф для этого курса пока не создан
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyPath;
