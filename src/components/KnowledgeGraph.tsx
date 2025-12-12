import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface KnowledgeGraphProps {
  nodes: any[];
  edges: any[];
  courseId: number;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ nodes, edges, courseId }) => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(800, containerRef.current.clientHeight)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (node: any) => {
    const status = node.user_status || node.status || 'not-started';
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in-progress':
        return '#f59e0b'; // amber
      case 'not-started':
        return '#6366f1'; // indigo
      case 'locked':
        return '#9ca3af'; // grey
      default:
        return '#9ca3af';
    }
  };

  const getNodeSize = (node: any) => {
    const baseSize = node.size || 1;
    const size = baseSize * 20;
    return hoveredNode === node.id ? size * 1.2 : size;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest('circle, text')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '800px',
        backgroundColor: '#1f2937',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
            const targetNode = nodes.find(n => n.id === edge.targetNodeId);
            if (!sourceNode || !targetNode) return null;

            const dx = (targetNode.x || 0) - (sourceNode.x || 0);
            const dy = (targetNode.y || 0) - (sourceNode.y || 0);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const endX = (targetNode.x || 0) - Math.cos(angle) * 25;
            const endY = (targetNode.y || 0) - Math.sin(angle) * 25;

            const edgeColor = edge.type === 'required' ? '#10b981' : edge.type === 'recommended' ? '#6366f1' : '#9ca3af';
            const strokeDash = edge.type === 'alternative' ? '5,5' : 'none';

            return (
              <g key={`edge-${edge.id}`}>
                <path
                  d={`M ${sourceNode.x || 0} ${sourceNode.y || 0} Q ${(sourceNode.x || 0) + dx * 0.5} ${(sourceNode.y || 0) + dy * 0.5 + 30} ${endX} ${endY}`}
                  stroke={edgeColor}
                  strokeWidth="2"
                  fill="none"
                  opacity={0.6}
                  strokeDasharray={strokeDash}
                />
                <path
                  d={`M ${endX} ${endY} L ${endX - 10 * Math.cos(angle - Math.PI / 6)} ${endY - 10 * Math.sin(angle - Math.PI / 6)} M ${endX} ${endY} L ${endX - 10 * Math.cos(angle + Math.PI / 6)} ${endY - 10 * Math.sin(angle + Math.PI / 6)}`}
                  stroke={edgeColor}
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            );
          })}

          {/* Render nodes */}
          {nodes.map((node: any) => {
            const nodeSize = getNodeSize(node);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const status = node.user_status || node.status || 'not-started';
            const isClickable = status !== 'locked';
            
            return (
              <g
                key={node.id}
                style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (isClickable) {
                    navigate(`/course/${courseId}/lesson/${node.entityId}`);
                  }
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Планета-вершина */}
                <circle
                  cx={node.x || 0}
                  cy={node.y || 0}
                  r={nodeSize}
                  fill={getNodeColor(node)}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  opacity={isHovered ? 0.9 : 1}
                  style={{ transition: 'all 0.2s' }}
                />
                {/* Ореол для пройденных */}
                {status === 'completed' && (
                  <circle
                    cx={node.x || 0}
                    cy={node.y || 0}
                    r={nodeSize + 5}
                    fill="none"
                    stroke={getNodeColor(node)}
                    strokeWidth="2"
                    opacity="0.3"
                  />
                )}
                {/* Иконка статуса */}
                {status === 'completed' && (
                  <text
                    x={node.x || 0}
                    y={(node.y || 0) + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="16"
                    fontWeight="bold"
                  >
                    ✓
                  </text>
                )}
                {status === 'locked' && (
                  <text
                    x={node.x || 0}
                    y={(node.y || 0) + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    🔒
                  </text>
                )}
                {/* Подпись */}
                <text
                  x={node.x || 0}
                  y={(node.y || 0) + nodeSize + 20}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          −
        </button>
        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          🧭
        </button>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
