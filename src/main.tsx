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
import { CourseEditor } from './admin/pages/CourseEditor';
import { ModulesManagement } from './admin/pages/ModulesManagement';
import { ModuleEditor } from './admin/pages/ModuleEditor';
import { LessonsManagement } from './admin/pages/LessonsManagement';
import { LessonsBuilder } from './admin/pages/LessonsBuilder';
import { LessonEditor } from './admin/pages/LessonEditor';
import { CreateLessonPage } from './admin/pages/CreateLessonPage';
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
            <Route path="courses/new" element={<CourseEditor />} />
            <Route path="courses/:id/edit" element={<CourseEditor />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="modules/new" element={<ModuleEditor />} />
            <Route path="modules/:id/edit" element={<ModuleEditor />} />
            <Route path="modules" element={<ModulesManagement />} />
            {/* Более специфичные маршруты должны идти первыми */}
            <Route path="lessons/create" element={<CreateLessonPage />} />
            <Route path="lessons/:id/edit" element={<LessonEditor />} />
            <Route path="lessons" element={<LessonsManagement />} />
            <Route path="lessons-builder" element={<LessonsBuilder />} />
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
