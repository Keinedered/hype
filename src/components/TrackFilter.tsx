import { Track, TrackId } from '../types';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { tracks } from '../data/mockData';

interface TrackFilterProps {
  selectedTrack: TrackId | 'all';
  onTrackChange: (trackId: TrackId | 'all') => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export function TrackFilter({
  selectedTrack,
  onTrackChange,
  selectedLevel,
  onLevelChange,
  selectedStatus,
  onStatusChange
}: TrackFilterProps) {
  return (
    <div className="space-y-6 bg-white border-2 border-black p-6 relative">
      {/* Decorative corner elements */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-black bg-white" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-black bg-white" />
      
      {/* Track tabs */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedTrack === 'all' ? 'default' : 'outline'}
          onClick={() => onTrackChange('all')}
          className="border-2 border-black font-mono tracking-wide hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          style={{
            backgroundColor: selectedTrack === 'all' ? '#000000' : '#ffffff',
            color: selectedTrack === 'all' ? '#ffffff' : '#000000'
          }}
        >
          ВСЕ ТРЕКИ
        </Button>
        {tracks.map((track, index) => (
          <div key={track.id} className="relative flex items-center gap-3">
            <Button
              variant={selectedTrack === track.id ? 'default' : 'outline'}
              onClick={() => onTrackChange(track.id)}
              className="border-2 border-black font-mono tracking-wide hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              style={{
                backgroundColor: selectedTrack === track.id ? track.color : '#ffffff',
                borderColor: '#000000',
                color: '#000000'
              }}
            >
              {track.name.toUpperCase()}
            </Button>
            {index < tracks.length - 1 && (
              <div className="w-px h-8 bg-black opacity-20" />
            )}
          </div>
        ))}
      </div>

      {/* Divider line */}
      <div className="border-t-2 border-black opacity-20" />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedLevel} onValueChange={onLevelChange}>
          <SelectTrigger className="w-[200px] border-2 border-black font-mono">
            <SelectValue placeholder="УРОВЕНЬ" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black font-mono">
            <SelectItem value="all">ВСЕ УРОВНИ</SelectItem>
            <SelectItem value="beginner">НАЧАЛЬНЫЙ</SelectItem>
            <SelectItem value="intermediate">СРЕДНИЙ</SelectItem>
            <SelectItem value="advanced">ПРОДВИНУТЫЙ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[200px] border-2 border-black font-mono">
            <SelectValue placeholder="СТАТУС" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black font-mono">
            <SelectItem value="all">ВСЕ СТАТУСЫ</SelectItem>
            <SelectItem value="not_started">НЕ НАЧАТ</SelectItem>
            <SelectItem value="in_progress">В ПРОЦЕССЕ</SelectItem>
            <SelectItem value="completed">ЗАВЕРШЁН</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="newest">
          <SelectTrigger className="w-[200px] border-2 border-black font-mono">
            <SelectValue placeholder="СОРТИРОВКА" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black font-mono">
            <SelectItem value="newest">ПО НОВИЗНЕ</SelectItem>
            <SelectItem value="popular">ПО ПОПУЛЯРНОСТИ</SelectItem>
            <SelectItem value="alphabetical">ПО АЛФАВИТУ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}