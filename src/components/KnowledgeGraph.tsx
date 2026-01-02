import { useState, useRef, useEffect, useMemo, WheelEvent, MouseEvent } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { courses, tracks } from '../data/mockData';
import { modulesAPI } from '../api/client';

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filter?: 'all' | 'completed' | 'uncompleted';
  onNodeClick?: (nodeId: string) => void;
}

export function KnowledgeGraph({ nodes, edges, filter = 'all', onNodeClick }: KnowledgeGraphProps) {
  const [zoom, setZoom] = useState(1.0); // Начальный zoom = 1.0 для нормального отображения
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{ completed: number; total: number; progress: number } | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Алгоритм вычисления границ графа (мемоизирован для производительности)
  const graphBounds = useMemo(() => {
    if (nodes.length === 0) {
      return {
        minX: 0,
        maxX: 2000,
        minY: 0,
        maxY: 1200,
        centerX: 1000,
        centerY: 600,
        width: 2000,
        height: 1200,
      };
    }

    // Фильтруем валидные координаты
    const validNodes = nodes.filter(n => 
      typeof n.x === 'number' && 
      typeof n.y === 'number' && 
      !isNaN(n.x) && 
      !isNaN(n.y) && 
      isFinite(n.x) && 
      isFinite(n.y)
    );

    if (validNodes.length === 0) {
      return {
        minX: 0,
        maxX: 2000,
        minY: 0,
        maxY: 1200,
        centerX: 1000,
        centerY: 600,
        width: 2000,
        height: 1200,
      };
    }

    const xs = validNodes.map(n => n.x);
    const ys = validNodes.map(n => n.y);

    const textPadding = 400; // Увеличенный отступ для меток
    const minX = Math.min(...xs) - textPadding;
    const maxX = Math.max(...xs) + textPadding;
    const minY = Math.min(...ys) - textPadding;
    const maxY = Math.max(...ys) + textPadding;
    const width = Math.max(maxX - minX, 2000);
    const height = Math.max(maxY - minY, 1200);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX,
      centerY,
      width,
      height,
    };
  }, [nodes]);

  // Вычисление viewBox на основе границ (простой и надежный подход)
  const viewBox = useMemo(() => {
    return `${graphBounds.minX} ${graphBounds.minY} ${graphBounds.width} ${graphBounds.height}`;
  }, [graphBounds]);

  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    // This is handled by the useEffect hook for better trackpad support
    // Keep this as fallback for direct SVG wheel events
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    // Only allow dragging on background or edges, not on nodes or text
    if (target === svgRef.current || target.tagName === 'line' || target.tagName === 'circle' && target.getAttribute('r') === '1') {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newZoom = Math.min(3, zoom * 1.2);
    const zoomChange = newZoom / zoom;
    setPan({
      x: centerX - (centerX - pan.x) * zoomChange,
      y: centerY - (centerY - pan.y) * zoomChange
    });
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newZoom = Math.max(0.3, zoom / 1.2);
    const zoomChange = newZoom / zoom;
    setPan({
      x: centerX - (centerX - pan.x) * zoomChange,
      y: centerY - (centerY - pan.y) * zoomChange
    });
    setZoom(newZoom);
  };

  const handleReset = () => {
    // Сбрасываем к начальному состоянию с центрированием графа
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = async (node: GraphNode) => {
    if (node.id === 'root') return;
    
    setSelectedNode(node);
    setModuleProgress(null);
    
    // Если это модуль, загружаем прогресс
    if (node.type === 'module') {
      const moduleId = node.entityId || node.id.replace('node-', '');
      if (moduleId) {
        setIsLoadingProgress(true);
        try {
          const progress = await modulesAPI.getProgress(moduleId);
          setModuleProgress({
            completed: progress.completed_lessons || 0,
            total: progress.total_lessons || 0,
            progress: progress.progress || 0
          });
        } catch (error) {
          console.error('Failed to load module progress:', error);
          setModuleProgress(null);
        } finally {
          setIsLoadingProgress(false);
        }
      }
    }
  };

  const getTrackColorForNode = (node: GraphNode): string | null => {
    if (node.id === 'root' || node.entityId === 'root') return null;

    // In this app's mock graph, node.id matches course.id
    const course = courses.find((c) => c.id === node.id) ?? courses.find((c) => c.id === node.entityId);
    if (course) {
      return tracks.find((t) => t.id === course.trackId)?.color ?? null;
    }

    // Fallbacks for future graph node types
    const track = tracks.find((t) => t.id === node.entityId) ?? tracks.find((t) => t.id === node.id);
    return track?.color ?? null;
  };

  const getNodeColors = (node: GraphNode) => {
    const trackColor = getTrackColorForNode(node) ?? '#000000';
    const isModule = node.type === 'module';

    // Для модулей: белый fill, разная обводка в зависимости от статуса
    if (isModule) {
      switch (node.status) {
        case 'completed':
        case 'current':
          // Активные модули - белый fill, черная жирная обводка
          return { fill: '#ffffff', stroke: '#000000', accent: trackColor, ring: trackColor, strokeWidth: 4 };
        case 'open':
          // Открытые модули - белый fill, серая тонкая обводка
          return { fill: '#ffffff', stroke: '#999999', accent: trackColor, ring: trackColor, strokeWidth: 1.5 };
        case 'closed':
          // Закрытые модули - белый fill, серая обводка
          return { fill: '#ffffff', stroke: '#cccccc', accent: trackColor, ring: trackColor, strokeWidth: 1.5 };
        default:
          // По умолчанию - белый fill, серая обводка
          return { fill: '#ffffff', stroke: '#999999', accent: trackColor, ring: trackColor, strokeWidth: 1.5 };
      }
    }

    // Для курсов и других узлов - акцентные цвета
    switch (node.status) {
      case 'completed':
        // Завершенные узлы - акцентный цвет с темной обводкой
        return { fill: trackColor, stroke: '#000000', accent: trackColor, ring: trackColor, strokeWidth: 3 };
      case 'current':
        // Текущие узлы - акцентный цвет с темной обводкой
        return { fill: trackColor, stroke: '#000000', accent: trackColor, ring: trackColor, strokeWidth: 3 };
      case 'open':
        // Открытые узлы - акцентный цвет с темной обводкой
        return { fill: trackColor, stroke: '#000000', accent: trackColor, ring: trackColor, strokeWidth: 3 };
      case 'closed':
        // Закрытые узлы - приглушенный акцентный цвет
        return { fill: trackColor, stroke: '#666666', accent: trackColor, ring: trackColor, strokeWidth: 2 };
      default:
        // По умолчанию - акцентный цвет
        return { fill: trackColor, stroke: '#000000', accent: trackColor, ring: trackColor, strokeWidth: 3 };
    }
  };

  const getEdgeStyle = (type: GraphEdge['type']) => {
    switch (type) {
      case 'required':
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 2 };
      case 'alternative':
        return { stroke: '#000000', strokeDasharray: '8,4', strokeWidth: 1.5 };
      case 'recommended':
        return { stroke: '#4a4a4a', strokeDasharray: '4,4', strokeWidth: 1 }; /* Улучшена контрастность */
      default:
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 2 };
    }
  };

  // Touchpad and touch support
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    let lastTouchDistance = 0;
    let lastPanPoint = { x: 0, y: 0 };
    let isPinching = false;

    // Handle wheel events (mouse wheel and trackpad)
    const handleWheelEvent = (e: WheelEvent) => {
      // Check if this is a trackpad gesture (has ctrlKey or is a pinch gesture)
      const isTrackpadZoom = e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50;
      
      if (container.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        
        if (isTrackpadZoom) {
          // Trackpad zoom gesture
          const rect = svg.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const zoomSpeed = 0.05;
          const delta = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
          const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
          
          const zoomChange = newZoom / zoom;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          setPan({
            x: centerX - (centerX - pan.x) * zoomChange + (mouseX - centerX) * (1 - zoomChange),
            y: centerY - (centerY - pan.y) * zoomChange + (mouseY - centerY) * (1 - zoomChange)
          });
          
          setZoom(newZoom);
        } else {
          // Regular scroll - pan the graph
          setPan({
            x: pan.x - e.deltaX * 0.5,
            y: pan.y - e.deltaY * 0.5
          });
        }
      }
    };

    // Handle touch events for mobile/trackpad
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastPanPoint = { x: pan.x, y: pan.y };
        e.preventDefault();
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        lastPanPoint = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastTouchDistance > 0) {
          const zoomChange = distance / lastTouchDistance;
          const newZoom = Math.max(0.3, Math.min(3, zoom * zoomChange));
          
          const rect = svg.getBoundingClientRect();
          const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
          const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
          
          const zoomDelta = newZoom / zoom;
          setPan({
            x: centerX - (centerX - pan.x) * zoomDelta,
            y: centerY - (centerY - pan.y) * zoomDelta
          });
          
          setZoom(newZoom);
          lastTouchDistance = distance;
        }
        e.preventDefault();
      } else if (e.touches.length === 1 && !isPinching) {
        // Single touch pan
        const touch = e.touches[0];
        setPan({
          x: pan.x + (touch.clientX - lastPanPoint.x),
          y: pan.y + (touch.clientY - lastPanPoint.y)
        });
        lastPanPoint = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
        lastTouchDistance = 0;
      }
    };

    // Add event listeners
    container.addEventListener('wheel', handleWheelEvent, { passive: false, capture: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelEvent, { capture: true } as any);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, pan]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-white border-2 border-black overflow-hidden"
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
      style={{ 
        touchAction: 'none',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto'
      }}
    >
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoomIn();
          }}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
          title="Увеличить"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoomOut();
          }}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
          title="Уменьшить"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReset();
          }}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono"
          title="Сбросить"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none', display: 'block', minHeight: '400px', width: '100%', height: '100%' }}
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

        {/* Основная группа - применяем pan и zoom через transform */}
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
            
            // Проверка существования узлов
            if (!source || !target) return null;
            
            // Проверка валидности координат
            if (
              isNaN(source.x) || isNaN(source.y) || 
              isNaN(target.x) || isNaN(target.y) ||
              !isFinite(source.x) || !isFinite(source.y) ||
              !isFinite(target.x) || !isFinite(target.y)
            ) {
              return null;
            }

            // Filter logic
            if (filter === 'completed') {
               if (source.status !== 'completed' || target.status !== 'completed') return null;
            } else if (filter === 'uncompleted') {
               // Show edge only if at least one node is uncompleted (open, current, closed)
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
                opacity={isHighlighted ? 1 : 0.7}
                markerEnd="url(#arrowhead-black)"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
             // Filter logic
             if (filter === 'completed' && node.status !== 'completed') return null;
             if (filter === 'uncompleted' && node.status === 'completed') return null;

            // Проверка валидности координат
            if (isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
              console.warn(`Invalid coordinates for node ${node.id}: x=${node.x}, y=${node.y}`);
              return null;
            }

            const colors = getNodeColors(node);
            // Размеры узлов в зависимости от типа
            let baseSize: number;
            let minRadius: number;
            if (node.type === 'course') {
              baseSize = node.size || 35; // Уменьшен размер курсов
              minRadius = 18;
            } else if (node.type === 'module') {
              baseSize = node.size || 45; // Уменьшен размер модулей
              minRadius = 22;
            } else if (node.type === 'concept') {
              baseSize = node.size || 30; // Уменьшен размер концептов
              minRadius = 15;
            } else {
              baseSize = node.size || 25; // Уменьшен размер остальных узлов
              minRadius = 12;
            }
            const radius = Math.max(baseSize / 2, minRadius);
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
                    opacity={node.status === 'closed' ? 0.35 : 0.8}
                  />
                )}

                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? (colors.strokeWidth || 3) + 1 : (colors.strokeWidth || 3)}
                  opacity={node.status === 'closed' ? 0.6 : 1}
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

                {/* Status indicator - removed checkmarks */}

                {/* Label with connecting line - positioned far from node to avoid overlap */}
                <g>
                  {(() => {
                    // Calculate all visual elements that extend from node
                    const selectionRing = isSelected ? 8 : 0;
                    const trackRing = node.id !== 'root' ? 4 : 0;
                    const cornerDecorations = (node.status === 'current' || isSelected) ? 6 : 0;
                    const maxVisualRadius = radius + Math.max(selectionRing, trackRing) + cornerDecorations;
                    
                    // Spacing to keep text close but not overlapping
                    const minSpacing = 70; // Увеличено расстояние между узлом и текстом
                    const lineHeight = 64; // Увеличен размер строки в 2 раза
                    const padding = 32; // Увеличен padding в 2 раза
                    const fixedBlockWidth = 400; // Фиксированная ширина блока
                    const fontSize = 40;
                    const charWidth = 24; // Примерная ширина символа
                    const maxCharsPerLine = Math.floor((fixedBlockWidth - padding * 2) / charWidth);
                    
                    // Функция для разбиения текста на строки с учетом фиксированной ширины
                    const wrapText = (text: string): string[] => {
                      const words = text.split(/\s+/);
                      const lines: string[] = [];
                      let currentLine = '';
                      
                      for (const word of words) {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        // Проверяем, помещается ли строка (с учетом заглавных букв)
                        if (testLine.length <= maxCharsPerLine) {
                          currentLine = testLine;
                        } else {
                          if (currentLine) {
                            lines.push(currentLine);
                          }
                          // Если слово само по себе длиннее строки, разбиваем его
                          if (word.length > maxCharsPerLine) {
                            let remainingWord = word;
                            while (remainingWord.length > maxCharsPerLine) {
                              lines.push(remainingWord.substring(0, maxCharsPerLine));
                              remainingWord = remainingWord.substring(maxCharsPerLine);
                            }
                            currentLine = remainingWord;
                          } else {
                            currentLine = word;
                          }
                        }
                      }
                      
                      if (currentLine) {
                        lines.push(currentLine);
                      }
                      
                      return lines.length > 0 ? lines : [text];
                    };
                    
                    // Разбиваем текст на строки (сначала по \n, потом по ширине)
                    const initialLines = node.title.split('\n');
                    const wrappedLines: string[] = [];
                    initialLines.forEach(line => {
                      wrappedLines.push(...wrapText(line));
                    });
                    
                    const lines = wrappedLines;
                    const totalHeight = lines.length * lineHeight + padding * 2;
                    const blockWidth = fixedBlockWidth;
                    
                    // Position label below the node (simpler and more readable)
                    // Always place label below node with proper spacing
                    const labelX = node.x;
                    const labelY = node.y + maxVisualRadius + minSpacing;
                    
                    // Connecting line from node bottom to label top
                    const lineStartY = node.y + maxVisualRadius;
                    const lineEndY = labelY - totalHeight / 2;
                    
                    // Функция для определения контрастного цвета текста
                    const getContrastColor = (bgColor: string): string => {
                      // Преобразуем hex в RGB
                      const hex = bgColor.replace('#', '');
                      if (hex.length !== 6) return '#000000'; // Fallback для некорректных цветов
                      const r = parseInt(hex.substring(0, 2), 16);
                      const g = parseInt(hex.substring(2, 4), 16);
                      const b = parseInt(hex.substring(4, 6), 16);
                      // Вычисляем яркость (luminance)
                      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                      // Если фон светлый, текст черный, иначе белый
                      return luminance > 0.5 ? '#000000' : '#ffffff';
                    };
                    
                    // Используем акцентный цвет для фона метки
                    const labelBgColor = colors.accent || '#000000';
                    const labelTextColor = getContrastColor(labelBgColor);
                    
                    return (
                      <>
                        {/* Connecting line from node to label */}
                        <line
                          x1={node.x}
                          y1={lineStartY}
                          x2={labelX}
                          y2={lineEndY}
                          stroke={labelBgColor}
                          strokeWidth="1.5"
                          opacity="0.4"
                          strokeDasharray="4,4"
                        />
                        
                        {/* Text block with background */}
                        <rect
                          x={labelX - blockWidth / 2}
                          y={labelY - totalHeight / 2}
                          width={blockWidth}
                          height={totalHeight}
                          fill={labelBgColor}
                          opacity="0.95"
                          rx="4"
                          stroke={labelTextColor}
                          strokeWidth="2"
                          strokeOpacity="0.8"
                        />
                        
                        {/* Text lines */}
                        {lines.map((line, i) => (
                          <text
                            key={i}
                            x={labelX}
                            y={labelY - totalHeight / 2 + padding + (i + 0.75) * lineHeight}
                            textAnchor="middle"
                            fill={labelTextColor}
                            fontSize={fontSize}
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                            fontWeight="700"
                            className="pointer-events-none"
                            style={{ textShadow: labelTextColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.3)' }}
                          >
                            {line.toUpperCase()}
                          </text>
                        ))}
                      </>
                    );
                  })()}
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
                  {selectedNode.status === 'open' && 'ОТКРЫТО'}
                  {selectedNode.status === 'closed' && 'ЗАКРЫТО'}
                </span>
              )}
            </div>
            
            {/* Прогресс модуля */}
            {selectedNode.type === 'module' && (
              <div className="space-y-2">
                {isLoadingProgress ? (
                  <div className="text-sm font-mono">Загрузка прогресса...</div>
                ) : moduleProgress ? (
                  <>
                    <div className="flex justify-between items-center text-sm font-mono">
                      <span>Прогресс выполнения:</span>
                      <span className="font-bold">
                        {moduleProgress.completed} / {moduleProgress.total} уроков
                      </span>
                    </div>
                    <Progress 
                      value={moduleProgress.progress} 
                      className="h-3 border-2 border-black"
                    />
                    <div className="text-xs font-mono text-gray-600">
                      {Math.round(moduleProgress.progress)}% завершено
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-mono text-gray-500">Прогресс недоступен</div>
                )}
              </div>
            )}
            
            <Button 
              className="w-full border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono tracking-wide transition-all" 
              disabled={selectedNode.status === 'closed'}
              onClick={() => onNodeClick?.(selectedNode.id)}
              style={{
                backgroundColor: selectedNode.status === 'closed' ? '#f5f5f5' : '#000000',
                color: selectedNode.status === 'closed' ? '#666666' : '#ffffff'
              }}
            >
              {selectedNode.status === 'closed' ? 'НЕДОСТУПНО' : selectedNode.type === 'module' ? 'ПЕРЕЙТИ К МОДУЛЮ' : 'ПЕРЕЙТИ К КУРСУ'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}