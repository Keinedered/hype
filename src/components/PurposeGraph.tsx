import { useId, useState } from 'react';
import { tracks } from '../data/mockData';

type Node = {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  color: string;
};

type Edge = {
  from: string;
  to: string;
};

const accentColors = tracks.map((t) => t.color);

const nodes: Node[] = [
  {
    id: 'structure',
    title: 'Структура',
    subtitle: 'Видно связи тем',
    x: 170,
    y: 230,
    color: accentColors[0] ?? '#E2B6C8',
  },
  {
    id: 'focus',
    title: 'Фокус',
    subtitle: 'Понятно, что дальше',
    x: 460,
    y: 135,
    color: accentColors[2] ?? '#B6C8E2',
  },
  {
    id: 'practice',
    title: 'Практика',
    subtitle: 'Закрепление навыка',
    x: 460,
    y: 335,
    color: accentColors[1] ?? '#B6E2C8',
  },
  {
    id: 'feedback',
    title: 'Обратная связь',
    subtitle: 'Рекомендации куратора',
    x: 720,
    y: 335,
    color: accentColors[3] ?? '#C8B6E2',
  },
  {
    id: 'progress',
    title: 'Прогресс',
    subtitle: 'Путь и состояние',
    x: 780,
    y: 165,
    color: accentColors[0] ?? '#E2B6C8',
  },
];

const edges: Edge[] = [
  { from: 'structure', to: 'focus' },
  { from: 'structure', to: 'practice' },
  { from: 'focus', to: 'progress' },
  { from: 'practice', to: 'feedback' },
  { from: 'feedback', to: 'progress' },
];

function getNodeById(id: string) {
  return nodes.find((n) => n.id === id);
}

export function PurposeGraph() {
  const id = useId();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="70 20 800 420"
        className="w-full min-w-[760px] h-auto text-foreground"
        role="img"
        aria-label="Ориентированный граф причин, зачем нужен GRAPH"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Enhanced gradients for nodes with better opacity */}
          {nodes.map((n) => (
            <radialGradient key={n.id} id={`${id}-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.65" />
              <stop offset="60%" stopColor={n.color} stopOpacity="0.20" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0" />
            </radialGradient>
          ))}
          
          {/* Hover gradients for interactive feedback */}
          {nodes.map((n) => (
            <radialGradient key={`hover-${n.id}`} id={`${id}-hover-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.85" />
              <stop offset="60%" stopColor={n.color} stopOpacity="0.30" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Glow filter for hover effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* edges with improved styling and hover effects */}
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {edges.map((e) => {
            const from = getNodeById(e.from);
            const to = getNodeById(e.to);
            if (!from || !to) return null;

            const edgeKey = `${e.from}->${e.to}`;
            const isHovered = hoveredEdge === edgeKey || hoveredNode === e.from || hoveredNode === e.to;

            // slight offsets so arrows don't sit directly on top of node centers
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / len;
            const uy = dy / len;

            const startPad = 22;
            const endPad = 26;

            const x1 = from.x + ux * startPad;
            const y1 = from.y + uy * startPad;
            const x2 = to.x - ux * endPad;
            const y2 = to.y - uy * endPad;

            // curved links read nicer than straight lines
            const cx = (x1 + x2) / 2 + uy * 18;
            const cy = (y1 + y2) / 2 - ux * 18;

            return (
              <path
                key={edgeKey}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                strokeWidth={isHovered ? 3 : 2.5}
                opacity={isHovered ? 0.6 : 0.4}
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredEdge(edgeKey)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
            );
          })}
        </g>

        {/* nodes with enhanced interactivity */}
        <g>
          {nodes.map((n) => {
            const isHovered = hoveredNode === n.id;
            
            return (
              <g 
                key={n.id} 
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Enhanced halo with animation */}
                <circle 
                  r={isHovered ? 52 : 44} 
                  fill={isHovered ? `url(#${id}-hover-${n.id})` : `url(#${id}-${n.id})`}
                  style={{
                    transition: 'r 0.3s ease, fill 0.3s ease',
                  }}
                />

                {/* Outer ring for depth */}
                <circle 
                  r={isHovered ? 18 : 17} 
                  fill="none" 
                  stroke={n.color} 
                  strokeOpacity={isHovered ? 0.4 : 0.2} 
                  strokeWidth={isHovered ? 3 : 2}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                />

                {/* Main node circle with glow on hover */}
                <circle 
                  r={isHovered ? 16 : 15} 
                  fill={n.color}
                  filter={isHovered ? "url(#glow)" : undefined}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                />
                
                {/* Inner highlight */}
                <circle 
                  r={isHovered ? 8 : 7} 
                  fill="white" 
                  opacity={isHovered ? 0.4 : 0.3}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                />

                {/* labels with improved styling and hover effects */}
                <text
                  x="0"
                  y="-68"
                  textAnchor="middle"
                  className="fill-current"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    transition: 'all 0.3s ease',
                  }}
                  fontSize={isHovered ? "20" : "18"}
                  fontWeight="700"
                  opacity={isHovered ? 1 : 0.95}
                >
                  {n.title}
                </text>
                <text
                  x="0"
                  y="-50"
                  textAnchor="middle"
                  className="fill-current"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    transition: 'all 0.3s ease',
                  }}
                  fontSize={isHovered ? "14" : "13"}
                  opacity={isHovered ? 0.85 : 0.7}
                >
                  {n.subtitle}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}


