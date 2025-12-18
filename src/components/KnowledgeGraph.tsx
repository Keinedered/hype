import { useState, useRef, useEffect } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { courses, tracks } from '../data/mockData';

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filter?: 'all' | 'completed' | 'uncompleted';
  onNodeClick?: (nodeId: string) => void;
}

export function KnowledgeGraph({ nodes, edges, filter = 'all', onNodeClick }: KnowledgeGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'line') {
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

  const handleZoomIn = () => setZoom((z) => Math.min(3, z * 1.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, z / 1.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = (node: GraphNode) => {
    if (node.id === 'root') return;
    
    // If the node corresponds to a course, select it
    // In our new mock data, node.id IS the course.id
    setSelectedNode(node);
    
    // We can navigate immediately or wait for the button click in the card
    // The previous implementation selected the node and showed a card
    // Let's keep that behavior but update the button to navigate to course
  };

  const getTrackColorForNode = (node: GraphNode): string | null => {
    if (node.id === 'root' || node.entityId === 'root') return null;

    // In this app's mock graph, node.id matches course.id
    const course = courses.find((c) => c.id === node.id) ?? courses.find((c) => c.id === node.entityId);
    if (course) {
      return tracks.find((t) => t.id === course.trackId)?.color ?? null;
    }

    // Fallbacks for future graph node types
    const track = tracks.find((t) => t.id === (node.entityId as any)) ?? tracks.find((t) => t.id === (node.id as any));
    return track?.color ?? null;
  };

  const getNodeColors = (node: GraphNode) => {
    const trackColor = getTrackColorForNode(node) ?? '#000000';

    switch (node.status) {
      case 'completed':
        return { fill: '#000000', stroke: '#000000', accent: trackColor, ring: trackColor };
      case 'current':
        return { fill: trackColor, stroke: '#000000', accent: trackColor, ring: trackColor };
      case 'available':
        return { fill: '#ffffff', stroke: '#000000', accent: trackColor, ring: trackColor };
      case 'locked':
        return { fill: '#f5f5f5', stroke: '#666666', accent: '#cccccc', ring: '#cccccc' };
      default:
        return { fill: '#ffffff', stroke: '#000000', accent: trackColor, ring: trackColor };
    }
  };

  const getEdgeStyle = (type: GraphEdge['type']) => {
    switch (type) {
      case 'required':
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 2 };
      case 'alternative':
        return { stroke: '#000000', strokeDasharray: '8,4', strokeWidth: 1.5 };
      case 'recommended':
        return { stroke: '#666666', strokeDasharray: '4,4', strokeWidth: 1 };
      default:
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 2 };
    }
  };

  return (
    <div className="relative w-full h-full bg-white border-2 border-black overflow-hidden">
      {/* Decorative grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Arrow marker for edges */}
          <marker
            id="arrowhead-black"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#000000" />
          </marker>
          <marker
            id="arrowhead-gray"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#666666" />
          </marker>
          
          {/* Pattern for decorative elements */}
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="black" opacity="0.1" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background decorative circles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <circle
              key={`bg-circle-${i}`}
              cx={Math.random() * 1000}
              cy={Math.random() * 800}
              r={Math.random() * 60 + 40}
              fill="none"
              stroke="#000000"
              strokeWidth="1"
              opacity={0.03}
            />
          ))}

          {/* Edges */}
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.sourceId);
            const target = nodes.find((n) => n.id === edge.targetId);
            
            if (!source || !target) return null;

            // Filter logic
            if (filter === 'completed') {
               if (source.status !== 'completed' || target.status !== 'completed') return null;
            } else if (filter === 'uncompleted') {
               // Show edge only if at least one node is uncompleted (available, current, locked)
               // Or should we hide completed paths?
               // Let's hide edges if both nodes are completed? No, that hides the path.
               // Let's keep all edges unless nodes are filtered out.
               // Actually, let's filter nodes first in rendering loop? No, SVG order matters.
               
               // Logic: If showing 'uncompleted', we want to see what is LEFT to do.
               // So completed nodes might be hidden or dimmed?
               // The prompt says "Only uncompleted".
               const isSourceCompleted = source.status === 'completed';
               const isTargetCompleted = target.status === 'completed';
               if (isSourceCompleted && isTargetCompleted) return null; 
            }

            const style = getEdgeStyle(edge.type);
            const isHighlighted = selectedNode?.id === source.id || selectedNode?.id === target.id;

            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={style.stroke}
                strokeWidth={isHighlighted ? style.strokeWidth * 1.5 : style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                opacity={isHighlighted ? 1 : 0.4}
                markerEnd={`url(#arrowhead-${edge.type === 'recommended' ? 'gray' : 'black'})`}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
             // Filter logic
             if (filter === 'completed' && node.status !== 'completed') return null;
             if (filter === 'uncompleted' && node.status === 'completed') return null;

            const colors = getNodeColors(node);
            const radius = (node.size || 40) / 2;
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all"
                onClick={() => handleNodeClick(node)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 8}
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth="3"
                    opacity={0.6}
                  />
                )}
                
                {/* Track color ring */}
                {node.id !== 'root' && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 4}
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth={3}
                    opacity={node.status === 'locked' ? 0.35 : 0.8}
                  />
                )}

                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 4 : 3}
                  opacity={node.status === 'locked' ? 0.5 : 1}
                  className="transition-all"
                />

                {/* Corner decorations for selected/current nodes */}
                {(node.status === 'current' || isSelected) && (
                  <>
                    <line x1={node.x - radius - 6} y1={node.y - radius - 6} x2={node.x - radius - 2} y2={node.y - radius - 6} stroke={colors.accent} strokeWidth="2" />
                    <line x1={node.x - radius - 6} y1={node.y - radius - 6} x2={node.x - radius - 6} y2={node.y - radius - 2} stroke={colors.accent} strokeWidth="2" />
                    
                    <line x1={node.x + radius + 6} y1={node.y + radius + 6} x2={node.x + radius + 2} y2={node.y + radius + 6} stroke={colors.accent} strokeWidth="2" />
                    <line x1={node.x + radius + 6} y1={node.y + radius + 6} x2={node.x + radius + 6} y2={node.y + radius + 2} stroke={colors.accent} strokeWidth="2" />
                  </>
                )}

                {/* Status indicator */}
                {node.status === 'completed' && (
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="24"
                    fontWeight="bold"
                  >
                    ✓
                  </text>
                )}

                {/* Label with black background */}
                <g>
                  {node.title.split('\n').map((line, i) => {
                    const textY = node.y + radius + 25 + (i * 16);
                    return (
                      <g key={i}>
                        <rect
                          x={node.x - 60}
                          y={textY - 12}
                          width="120"
                          height="16"
                          fill="#000000"
                          opacity="0.9"
                        />
                        <text
                          x={node.x}
                          y={textY}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontFamily="monospace"
                          className="pointer-events-none"
                        >
                          {line.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Node details card */}
      {selectedNode && (
        <Card className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 p-6 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            <div className="bg-black text-white px-3 py-2 inline-block font-mono text-sm tracking-wide">
              {selectedNode.title.replace(/\n/g, ' ').toUpperCase()}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 border-2 border-black font-mono tracking-wide">
                {selectedNode.type.toUpperCase()}
              </span>
              {selectedNode.status && (
                <span 
                  className="text-xs px-3 py-1 border-2 border-black font-mono tracking-wide"
                  style={{ backgroundColor: getNodeColors(selectedNode).accent }}
                >
                  {selectedNode.status === 'completed' && 'ПРОЙДЕНО'}
                  {selectedNode.status === 'current' && 'ТЕКУЩАЯ'}
                  {selectedNode.status === 'available' && 'ДОСТУПНО'}
                  {selectedNode.status === 'locked' && 'ЗАБЛОКИРОВАНО'}
                </span>
              )}
            </div>
            <Button 
              className="w-full border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono tracking-wide transition-all" 
              disabled={selectedNode.status === 'locked'}
              onClick={() => onNodeClick?.(selectedNode.id)}
              style={{
                backgroundColor: selectedNode.status === 'locked' ? '#f5f5f5' : '#000000',
                color: selectedNode.status === 'locked' ? '#666666' : '#ffffff'
              }}
            >
              {selectedNode.status === 'locked' ? 'НЕДОСТУПНО' : 'ПЕРЕЙТИ К КУРСУ'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}