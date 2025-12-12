import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { api } from '../../services/api';

const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'accepted' | 'needs-revision'>('accepted');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    api.get('/admin/submissions/pending')
      .then(response => {
        setSubmissions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading submissions:', error);
        setLoading(false);
      });
  };

  const handleReview = (submissionId: number) => {
    api.put(`/submissions/${submissionId}/review`, {
      status: reviewStatus,
      curatorComment: reviewComment
    })
      .then(() => {
        loadSubmissions();
        setSelectedSubmission(null);
        setReviewComment('');
      })
      .catch(error => {
        console.error('Error reviewing submission:', error);
        alert('Ошибка при проверке задания');
      });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div>Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
        Проверка заданий
      </h1>

      {submissions.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '48px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Нет заданий на проверке
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* List of submissions */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxHeight: '800px',
            overflowY: 'auto'
          }}>
            {submissions.map(submission => (
              <div
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: selectedSubmission?.id === submission.id ? '#f3f4f6' : 'transparent'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {submission.assignment_title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {submission.course_title} • {submission.lesson_title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {submission.user_name} • {new Date(submission.submitted_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>

          {/* Review panel */}
          {selectedSubmission && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                Проверка задания
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Студент:</div>
                <div style={{ fontWeight: 600 }}>{selectedSubmission.user_name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{selectedSubmission.user_email}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Курс:</div>
                <div>{selectedSubmission.course_title} • {selectedSubmission.lesson_title}</div>
              </div>

              {selectedSubmission.text_answer && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Текстовый ответ:</div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px'
                  }}>
                    {selectedSubmission.text_answer}
                  </div>
                </div>
              )}

              {selectedSubmission.link_url && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Ссылка:</div>
                  <a
                    href={selectedSubmission.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    {selectedSubmission.link_url}
                  </a>
                </div>
              )}

              {selectedSubmission.file_urls && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Файлы:</div>
                  {JSON.parse(selectedSubmission.file_urls).map((url: string, idx: number) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        color: '#2563eb',
                        textDecoration: 'underline',
                        marginBottom: '4px'
                      }}
                    >
                      Файл {idx + 1}
                    </a>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Статус:
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as 'accepted' | 'needs-revision')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="accepted">Принято</option>
                  <option value="needs-revision">Нужна доработка</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  Комментарий куратора:
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Оставьте комментарий для студента..."
                />
              </div>

              <button
                onClick={() => handleReview(selectedSubmission.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                Отправить проверку
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubmissions;
