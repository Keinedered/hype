import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { AdminLayout } from './admin/components/AdminLayout';
import { Dashboard } from './admin/pages/Dashboard';
import { CoursesManagement } from './admin/pages/CoursesManagement';
import { ModulesManagement } from './admin/pages/ModulesManagement';
import { LessonsManagement } from './admin/pages/LessonsManagement';
import { LessonsBuilder } from './admin/pages/LessonsBuilder';
import { LessonEditor } from './admin/pages/LessonEditor';
import { GraphEditor } from './admin/pages/GraphEditor';
import { HandbookManagement } from './admin/pages/HandbookManagement';
import { AssignmentsManagement } from './admin/pages/AssignmentsManagement';
import { UsersManagement } from './admin/pages/UsersManagement';
import { Analytics } from './admin/pages/Analytics';
import { Toaster } from './components/ui/sonner';

// Protected Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  // В реальном приложении нужно проверять роль пользователя
  if (!token) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Page */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Main App */}
          <Route path="/" element={<App />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="modules" element={<ModulesManagement />} />
            <Route path="lessons" element={<LessonsBuilder />} />
            <Route path="lessons/new" element={<LessonEditor />} />
            <Route path="lessons/:id/edit" element={<LessonEditor />} />
            <Route path="lessons-old" element={<LessonsManagement />} />
            <Route path="graph" element={<GraphEditor />} />
            <Route path="handbook" element={<HandbookManagement />} />
            <Route path="assignments" element={<AssignmentsManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
