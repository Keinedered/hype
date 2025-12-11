import React from 'react';

interface TrackFilterBarProps {
  tracks: string[];
  selected: string;
  onSelect: (track: string) => void;
}

const TrackFilterBar: React.FC<TrackFilterBarProps> = ({ tracks, selected, onSelect }) => {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tracks.map(track => (
          <button
            key={track}
            onClick={() => onSelect(track)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: track === selected ? '#2563eb' : '#d1d5db',
              backgroundColor: track === selected ? '#2563eb' : '#ffffff',
              color: track === selected ? '#ffffff' : '#374151',
              cursor: 'pointer'
            }}
          >
            {track}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrackFilterBar;