import { useId, useState, useEffect } from 'react';

type Node = {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
};

type Edge = {
  from: string;
  to: string;
};

const nodes: Node[] = [
  { id: 'structure', title: 'Структура', subtitle: 'Видно связи тем', x: 170, y: 230 },
  { id: 'focus', title: 'Фокус', subtitle: 'Понятно, что дальше', x: 460, y: 135 },
  { id: 'practice', title: 'Практика', subtitle: 'Закрепление навыка', x: 460, y: 335 },
  { id: 'feedback', title: 'Обратная связь', subtitle: 'Рекомендации куратора', x: 720, y: 335 },
  { id: 'progress', title: 'Прогресс', subtitle: 'Путь и состояние', x: 780, y: 165 },
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
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = () => window.innerWidth <= 767;
    const handle = () => setIsNarrow(mq());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      {isNarrow ? (
        <div className="w-full">
          <ul className="space-y-4">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-start gap-4">
                <div className="w-8 h-8 border-2 border-black bg-white rounded-sm flex-shrink-0" />
                <div className="flex-1 rounded-lg border-2 border-black p-3 bg-white">
                  <div className="font-mono font-bold text-lg">{n.title}</div>
                  <div className="font-mono text-sm text-muted-foreground">{n.subtitle}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <svg
          viewBox="0 0 900 500"
          className="w-full min-w-[760px] h-auto text-foreground"
          role="img"
          aria-label="Ориентированный граф причин, зачем нужен GRAPH"
          preserveAspectRatio="xMidYMid meet"
        >
        <g opacity="0.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {edges.map((e) => {
            const from = getNodeById(e.from);
            const to = getNodeById(e.to);
            if (!from || !to) return null;

            const rectSize = 30; 
            const offset = rectSize / 2 + 4;

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const startX = from.x + ux * offset;
            const startY = from.y + uy * offset;
            const endX = to.x - ux * offset;
            const endY = to.y - uy * offset;

            const magnitude = Math.max(40, Math.min(160, dist * 0.25));
            const c1x = startX + dx * 0.25;
            const c1y = startY + dy * 0.25 + magnitude;
            const c2x = startX + dx * 0.75;
            const c2y = startY + dy * 0.75 + magnitude;

            const d = `M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`;

            return (
              <path
                key={`${e.from}->${e.to}`}
                d={d}
                fill="none"
                opacity={0.5}
                className="purpose-edge"
              />
            );
          })}
        </g>

        <g>
          {nodes.map((n) => {
            const titleFont = 18;
            const subtitleFont = 13;
            const padding = 8;
            const lineGap = 6;
            const titleWidth = n.title.length * 10;
            const subtitleWidth = n.subtitle.length * 8;
            const blockWidth = Math.max(titleWidth, subtitleWidth) + padding * 2;
            const totalHeight = titleFont + lineGap + subtitleFont + padding * 2;
            const centerY = - (padding + subtitleFont + lineGap / 2 + titleFont / 2);

            const titleY = centerY - totalHeight / 2 + padding + titleFont * 0.75;
            const subtitleY = titleY + subtitleFont + lineGap / 2;

            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                <rect
                  x={-15}
                  y={-15}
                  width={30}
                  height={30}
                  fill="white"
                  stroke="black"
                  strokeWidth={2}
                  rx={4}
                />

                {/* label background */}
                <rect
                  x={-blockWidth / 2}
                  y={centerY - totalHeight / 2}
                  width={blockWidth}
                  height={totalHeight}
                  rx={10}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={2}
                />

                <text
                  x="0"
                  y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current font-mono"
                >
                  <tspan x="0" dy={-(subtitleFont / 2 + lineGap / 2)} fontSize={titleFont} fontWeight={700}>
                    {n.title}
                  </tspan>
                  <tspan x="0" dy={subtitleFont + lineGap} fontSize={subtitleFont} opacity="0.7">
                    {n.subtitle}
                  </tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>
        )}
    </div>
  );
}
