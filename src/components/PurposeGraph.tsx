import { useId } from 'react';
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
          {/* subtle colored halos for nodes */}
          {nodes.map((n) => (
            <radialGradient key={n.id} id={`${id}-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.55" />
              <stop offset="70%" stopColor={n.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* edges (no arrowheads) */}
        <g opacity="0.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {edges.map((e) => {
            const from = getNodeById(e.from);
            const to = getNodeById(e.to);
            if (!from || !to) return null;

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
                key={`${e.from}->${e.to}`}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                opacity="0.9"
              />
            );
          })}
        </g>

        {/* nodes */}
        <g>
          {nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              {/* halo */}
              <circle r="44" fill={`url(#${id}-${n.id})`} />

              {/* point */}
              <circle r="15" fill={n.color} />
              <circle r="15" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />

              {/* labels - positioned well above the node and halo to avoid overlap */}
              <text
                x="0"
                y="-68"
                textAnchor="middle"
                className="fill-current"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                fontSize="18"
                fontWeight="700"
              >
                {n.title}
              </text>
              <text
                x="0"
                y="-50"
                textAnchor="middle"
                className="fill-current"
                opacity="0.7"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                fontSize="13"
              >
                {n.subtitle}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}


