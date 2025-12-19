import { Bell, Menu, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Header({ currentPage = 'home', onNavigate }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const navigation = [
    { id: 'catalog', label: 'КАТАЛОГ' },
    { id: 'path', label: 'МОЙ ПУТЬ' },
    { id: 'courses', label: 'МОИ КУРСЫ' },
    { id: 'about', label: 'О ПЛАТФОРМЕ' }
  ];

  const mockNotifications = [
    {
      id: '1',
      type: 'submission_reviewed' as const,
      title: 'ЗАДАНИЕ ПРОВЕРЕНО',
      message: 'Ваше задание по уроку "Интервью с пользователями" требует доработки',
      time: '2 часа назад',
      isRead: false,
      relatedUrl: 'lesson/3',
      color: '#E2B6C8'
    },
    {
      id: '2',
      type: 'new_branch_unlocked' as const,
      title: 'ОТКРЫТА НОВАЯ ВЕТКА',
      message: 'Теперь вам доступен Модуль 3: Постановка задач и метрик',
      time: '1 день назад',
      isRead: false,
      relatedUrl: 'course/product-intro',
      color: '#B6E2C8'
    },
    {
      id: '3',
      type: 'reminder' as const,
      title: 'НЕ ЗАБУДЬТЕ',
      message: 'У вас есть незавершённое задание в курсе "Внешние коммуникации компании"',
      time: '2 дня назад',
      isRead: true,
      relatedUrl: 'lesson/5',
      color: '#B6C8E2'
    }
  ];

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotificationClick = (url: string) => {
    setShowNotifications(false);
    onNavigate?.(url);
  };

  const handleNav = (page: string) => {
    setShowNotifications(false);
    onNavigate?.(page);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-black opacity-30" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-black opacity-20" />
      
      <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
        {/* Decorative corner lines */}
        <div className="absolute top-0 left-6 w-px h-full bg-black opacity-10" />
        <div className="absolute top-0 right-6 w-px h-full bg-black opacity-10" />
        
        <div className="flex items-center gap-12">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-4 text-left group"
            aria-label="На главную"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <span className="text-white text-xs font-mono tracking-wider">GR</span>
              </div>
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-black" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-black" />
            </div>
            <div>
              <div className="font-mono tracking-[0.15em] uppercase text-lg font-bold group-hover:underline">
                GRAPH
              </div>
              <div className="text-[10px] text-muted-foreground font-mono tracking-wide uppercase">
                Выстрой свой путь
              </div>
            </div>
          </button>
          
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item, index) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => onNavigate?.(item.id)}
                  className={`font-mono text-sm tracking-wide transition-all hover:bg-black hover:text-white px-3 py-1 ${
                    currentPage === item.id 
                      ? 'bg-black text-white' 
                      : 'text-black'
                  }`}
                >
                  {item.label}
                </button>
                {index < navigation.length - 1 && (
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-px h-4 bg-black opacity-20" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile navigation (no burger icon) */}
          <div className="only-mobile">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-2 border-black hover:bg-black hover:text-white transition-all"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <DropdownMenuLabel className="font-mono uppercase tracking-wide text-xs">
                  Навигация
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/20" />
                {navigation.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => handleNav(item.id)}
                    className="font-mono uppercase tracking-wide"
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-black/20" />
                <DropdownMenuItem onSelect={() => handleNav('profile')} className="font-mono uppercase tracking-wide">
                  Профиль
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative" ref={notificationRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="border-2 border-black hover:bg-black hover:text-white transition-all"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-black text-white border-2 border-white font-mono text-xs"
              >
                {unreadCount}
              </Badge>
            )}

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="fixed left-4 right-4 top-20 mt-2 w-auto max-h-[calc(100vh-7rem)] overflow-y-auto bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-h-[500px]">
                <div className="bg-black text-white px-4 py-3 font-mono text-sm tracking-wide uppercase flex justify-between items-center sticky top-0">
                  <span>Уведомления</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
                <div className="divide-y-2 divide-black">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.relatedUrl)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-gray-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-1 h-full mt-1"
                          style={{ backgroundColor: notification.color }}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-mono font-bold text-xs uppercase tracking-wide">{notification.title}</h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-black rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm font-mono text-gray-600 leading-relaxed">{notification.message}</p>
                          <span className="text-xs font-mono text-gray-400">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-black p-3 bg-gray-50">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate?.('profile-notifications');
                    }}
                    className="w-full text-center font-mono text-xs uppercase tracking-wide hover:underline"
                  >
                    Показать все
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="border-2 border-black hover:bg-black hover:text-white transition-all"
            onClick={() => handleNav('profile')}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}