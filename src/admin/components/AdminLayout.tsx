import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  FileText as FileTextIcon,
  Network,
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { ErrorBoundary } from './ErrorBoundary';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/courses', label: 'Курсы', icon: BookOpen },
  { path: '/admin/modules', label: 'Модули', icon: FolderOpen },
  { path: '/admin/lessons', label: 'Уроки', icon: FileTextIcon },
  { path: '/admin/graph', label: 'Граф знаний', icon: Network },
  { path: '/admin/handbook', label: 'Handbook', icon: FileText },
  { path: '/admin/assignments', label: 'Задания', icon: ClipboardList },
  { path: '/admin/users', label: 'Пользователи', icon: Users },
  { path: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-950 admin-panel">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          bg-gray-900 border-r border-gray-800 
          transition-all duration-300 
          flex flex-col
          fixed left-0 top-0 h-screen
          z-50
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800 shrink-0">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 hover:text-white"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-hidden flex flex-col min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-3 py-2 
                  transition-colors shrink-0
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-gray-800 space-y-1 shrink-0">
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 py-2 h-auto"
          >
            <Home size={18} className={sidebarOpen ? "mr-2" : ""} />
            {sidebarOpen && <span className="text-sm">На сайт</span>}
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 py-2 h-auto"
          >
            <LogOut size={18} className={sidebarOpen ? "mr-2" : ""} />
            {sidebarOpen && <span className="text-sm">Выйти</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto bg-gray-950"
        style={{ marginLeft: sidebarOpen ? '256px' : '80px', transition: 'margin-left 0.3s' }}
      >
        <div className="container mx-auto p-6">
          <ErrorBoundary>
            <Breadcrumbs />
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
