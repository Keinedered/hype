import { Course } from '../types';
import { tracks } from '../data/mockData';
import { Button } from './ui/button';
import { BookOpen, Video, CheckCircle2 } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onSelect?: (courseId: string) => void;
}

export function CourseCard({ course, onSelect }: CourseCardProps) {
  const track = tracks.find((t) => t.id === course.trackId);
  const trackColor = track?.color || '#000';
  const trackName = track?.name || 'Общее';

  const getLevelLabel = (level: Course['level']) => {
    switch (level) {
      case 'beginner': return 'НАЧАЛЬНЫЙ';
      case 'intermediate': return 'СРЕДНИЙ';
      case 'advanced': return 'ПРОДВИНУТЫЙ';
    }
  };

  const getStatusLabel = (status?: Course['status']) => {
    switch (status) {
      case 'in_progress': return 'В ПРОЦЕССЕ';
      case 'completed': return 'ЗАВЕРШЁН';
      default: return null;
    }
  };

  return (
    <div 
      className="relative border-2 border-black bg-white flex flex-col h-full hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-300"
    >
      <div className="p-6 flex flex-col h-full space-y-4 relative">
        {/* Decorative thin line */}
        <div className="absolute top-4 right-4 w-8 h-px bg-black opacity-20" />
        
        {/* Top Tags */}
        <div className="flex flex-wrap gap-2 items-start">
          <span className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-black rounded-full bg-white">
            {getLevelLabel(course.level)}
          </span>
          <span 
            className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-black rounded-full"
            style={{ backgroundColor: trackColor }}
          >
            {trackName}
          </span>
        </div>

        {/* Recruitment Status - moved down from top, but kept prominent if needed, or simplified */}
        {course.enrollmentDeadline && (
          <div className="inline-flex items-center gap-2 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="uppercase tracking-wide">Набор открыт до {course.enrollmentDeadline}</span>
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-2 flex-1">
          <h3 className="font-mono text-xl font-bold tracking-tight uppercase leading-tight">
            {course.title}
          </h3>
          <p className="text-sm font-mono leading-relaxed opacity-80 line-clamp-3">
            {course.shortDescription}
          </p>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono py-4 border-t border-black/10">
          <div>
            <div className="font-bold mb-1">ФОРМАТ:</div>
            <div>ОНЛАЙН</div>
          </div>
          <div>
            <div className="font-bold mb-1">ДЛЯ КОГО:</div>
            <div>{course.level === 'beginner' ? 'ДЛЯ ВСЕХ' : 'ДЛЯ СПЕЦИАЛИСТОВ'}</div>
          </div>
        </div>

        {/* Progress or Footer */}
        <div className="space-y-4 pt-2">
          {course.progress !== undefined ? (
             <div className="space-y-2">
               <div className="flex justify-between text-xs font-mono">
                 <span className="uppercase tracking-wide">Прогресс</span>
                 <span className="font-bold text-black">{course.progress}%</span>
               </div>
               <div className="relative h-1 bg-gray-100 border border-black/20">
                 <div 
                   className="absolute top-0 left-0 h-full transition-all"
                   style={{ 
                     backgroundColor: '#000000',
                     width: `${course.progress}%`
                   }}
                 />
               </div>
             </div>
          ) : null}
          
          <Button 
            variant="outline" 
            className="w-full border-2 border-black font-mono uppercase tracking-widest text-xs h-10 hover:bg-black hover:text-white transition-all"
            onClick={() => {
              onSelect?.(course.id);
            }}
          >
            {course.status === 'in_progress' ? 'Продолжить' : 'Подробнее'}
          </Button>
        </div>
      </div>
    </div>
  );
}
