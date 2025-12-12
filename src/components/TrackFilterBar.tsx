import React from 'react';

interface TrackFilterBarProps {
  tracks: any[];
  selectedTrackId: number | null;
  onSelect: (trackId: number | null) => void;
}

const TrackFilterBar: React.FC<TrackFilterBarProps> = ({ tracks, selectedTrackId, onSelect }) => {
  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => onSelect(null)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: selectedTrackId === null ? '#111827' : '#d1d5db',
            backgroundColor: selectedTrackId === null ? '#111827' : '#ffffff',
            color: selectedTrackId === null ? '#ffffff' : '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          Все курсы
        </button>
        {tracks.map(track => (
          <button
            key={track.id}
            onClick={() => onSelect(track.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: selectedTrackId === track.id ? track.color : track.color + '40',
              backgroundColor: selectedTrackId === track.id ? track.color : '#ffffff',
              color: selectedTrackId === track.id ? '#ffffff' : track.color,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {track.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrackFilterBar;