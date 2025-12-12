import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Layout from './Layout';
import Header from './Header';

const AssignmentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/submissions/my')
      .then(response => {
        setSubmissions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading submissions:', error);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'needs-revision':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending':
        return { bg: '#dbeafe', text: '#1e40af' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Принято';
      case 'needs-revision':
        return 'Нужна доработка';
      case 'pending':
        return 'На проверке';
      default:
        return 'Не отправлено';
    }
  };

  return (
    <Layout>
      <Header />
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
          История заданий
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Загрузка...</div>
        ) : submissions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
              У вас пока нет отправленных заданий
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Курс / Урок</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Задание</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Дата отправки</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Статус</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission: any) => {
                  const statusColors = getStatusColor(submission.status);

                  return (
                    <tr key={submission.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ fontWeight: 600 }}>{submission.course_title}</div>
                        <div style={{ color: '#6b7280', fontSize: '12px' }}>{submission.lesson_title}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {submission.assignment_title}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(submission.submitted_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: statusColors.bg,
                          color: statusColors.text
                        }}>
                          {getStatusText(submission.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => {
                            // Extract course and lesson IDs from submission data
                            // This would need to be added to the API response
                            navigate(`/assignment-history`);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssignmentHistory;
