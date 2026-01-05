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
  onNodeClick?: (nodeId: string, nodeType?: string) => void;
}

export function KnowledgeGraph({ nodes, edges, filter = 'all', onNodeClick }: KnowledgeGraphProps) {
  const [zoom, setZoom] = useState(0.5); // Начальный zoom = 0.5 для более широкого обзора
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{ completed: number; total: number; progress: number } | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Generate unique pattern ID once per component instance
  const patternId = useMemo(() => `dot-pattern-${Math.random().toString(36).slice(2, 11)}`, []);

  // Фиксированные размеры поля для фона (территория за графом)
  const GRAPH_FIELD_WIDTH = 6000;
  const GRAPH_FIELD_HEIGHT = 4000;
  
  // Фиксированные границы для фона
  const backgroundBounds = useMemo(() => {
    return {
      minX: 0,
      minY: 0,
      width: GRAPH_FIELD_WIDTH,
      height: GRAPH_FIELD_HEIGHT,
    };
  }, []);

  // Алгоритм вычисления границ графа на основе позиций узлов (мемоизирован для производительности)
  const graphBounds = useMemo(() => {
    if (nodes.length === 0) {
      return {
        minX: -1000,
        minY: -1000,
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
        minY: 0,
        width: 2000,
        height: 1200,
      };
    }

    const xs = validNodes.map(n => n.x);
    const ys = validNodes.map(n => n.y);

    const textPadding = 400; // Увеличенный отступ для меток
    const minX = Math.min(...xs) - textPadding;
    const minY = Math.min(...ys) - textPadding;
    const maxX = Math.max(...xs) + textPadding;
    const maxY = Math.max(...ys) + textPadding;
    const width = Math.max(maxX - minX, 2000);
    const height = Math.max(maxY - minY, 1200);

    return {
      minX,
      minY,
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
      // Сохраняем начальную позицию мыши и текущий pan для расчета с коэффициентом скорости
      setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      // Вычисляем разницу от начальной позиции и умножаем на 4 для увеличения скорости в 4 раза
      const deltaX = (e.clientX - dragStart.x) * 4;
      const deltaY = (e.clientY - dragStart.y) * 4;
      setPan({
        x: dragStart.panX + deltaX,
        y: dragStart.panY + deltaY
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
    
    // Вызываем onNodeClick с типом узла для правильной навигации
    // Используем entityId для модулей и уроков, так как node.id может быть в формате "node-{id}"
    if (onNodeClick) {
      const nodeId = node.entityId || node.id.replace(/^node-/, '');
      onNodeClick(nodeId, node.type);
    }
    
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
          if (import.meta.env.DEV) {
            console.error('Failed to load module progress:', error);
          }
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
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 4 };
      case 'alternative':
        return { stroke: '#000000', strokeDasharray: '8,4', strokeWidth: 3 };
      case 'recommended':
        return { stroke: '#333333', strokeDasharray: '4,4', strokeWidth: 2.5 };
      default:
        return { stroke: '#000000', strokeDasharray: '0', strokeWidth: 4 };
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
          // Regular scroll - pan the graph with increased speed
          setPan({
            x: pan.x - e.deltaX * 1.0,
            y: pan.y - e.deltaY * 1.0
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
        WebkitOverflowScrolling: 'auto',
        backgroundColor: '#fafafa'
      }}
    >

      {/* Controls - improved design */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoomIn();
          }}
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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
          className="bg-white border-2 border-black hover:bg-black hover:text-white transition-all font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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
          {/* Dotted background pattern that scales with the graph */}
          <pattern 
            id={patternId}
            x="0" 
            y="0" 
            width="150" 
            height="150" 
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
          >
            <circle cx="75" cy="75" r="7" fill="#000000" />
          </pattern>
        </defs>
        
        {/* Основная группа - применяем pan и zoom через transform */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background pattern - фиксированное поле за графом - покрывает всю площадь */}
          <rect 
            x="0" 
            y="0" 
            width="6000" 
            height="4000" 
            fill={`url(#${patternId})`}
            opacity={0.6}
            className="pointer-events-none"
          />
          
          {/* Smooth curved edges */}
          {(() => {
            // Вычисляем скорректированные углы для edges от одного узла
            const MIN_ANGLE = 15 * Math.PI / 180; // 15 градусов в радианах
            const edgeAngleCorrections = new Map<string, number>();
            
            // Группируем edges по sourceId
            const edgesBySource = new Map<string, typeof edges>();
            edges.forEach(edge => {
              if (!edgesBySource.has(edge.sourceId)) {
                edgesBySource.set(edge.sourceId, []);
              }
              edgesBySource.get(edge.sourceId)!.push(edge);
            });

            // Для каждой группы edges вычисляем и корректируем углы
            edgesBySource.forEach((sourceEdges, sourceId) => {
              if (sourceEdges.length <= 1) return;

              const source = nodes.find(n => n.id === sourceId);
              if (!source) return;

              // Вычисляем углы для всех edges от этого узла
              const angles: Array<{ edge: typeof edges[0]; angle: number; originalAngle: number }> = [];
              
              sourceEdges.forEach(edge => {
                const target = nodes.find(n => n.id === edge.targetId);
                if (!target) return;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const angle = Math.atan2(dy, dx);
                angles.push({ edge, angle, originalAngle: angle });
              });

              // Сортируем по углу
              angles.sort((a, b) => a.angle - b.angle);

              // Проверяем и корректируем углы, если они слишком близки
              let hasChanges = true;
              let iterations = 0;
              while (hasChanges && iterations < 10) {
                hasChanges = false;
                iterations++;
                
                for (let i = 0; i < angles.length; i++) {
                  const current = angles[i];
                  const next = angles[(i + 1) % angles.length];
                  
                  // Вычисляем разницу углов (учитываем переход через 0)
                  let angleDiff = next.angle - current.angle;
                  if (angleDiff < 0) angleDiff += Math.PI * 2;
                  if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                  // Если угол слишком маленький, корректируем
                  if (angleDiff < MIN_ANGLE && angleDiff > 0.001) {
                    const correction = (MIN_ANGLE - angleDiff) / 2;
                    angles[i].angle -= correction;
                    angles[(i + 1) % angles.length].angle += correction;
                    hasChanges = true;
                    
                    // Нормализуем углы
                    angles.forEach(a => {
                      while (a.angle >= Math.PI * 2) a.angle -= Math.PI * 2;
                      while (a.angle < 0) a.angle += Math.PI * 2;
                    });
                  }
                }
              }

              // Сохраняем корректировки
              angles.forEach(({ edge, angle, originalAngle }) => {
                const correction = angle - originalAngle;
                edgeAngleCorrections.set(edge.id, correction);
              });
            });

            return edges.map((edge) => {
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

            // Calculate smooth curve control points
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Базовое направление от source к target
            let baseAngle = Math.atan2(dy, dx);
            
            // Применяем коррекцию угла, если она есть (для обеспечения минимального угла между линиями)
            const angleCorrection = edgeAngleCorrections.get(edge.id) || 0;
            const correctedAngle = baseAngle + angleCorrection;
            
            // Вычисляем скорректированное направление для начальной точки
            const correctedUx = Math.cos(correctedAngle);
            const correctedUy = Math.sin(correctedAngle);
            
            // Оригинальное направление для конечной точки (не меняем)
            const ux = dx / len;
            const uy = dy / len;

            // Node radius for padding
            const getNodeRadius = (node: GraphNode) => {
              // Для корневого узла используем размер текста
              const isRoot = node.id === 'root' || node.entityId === 'root' || (node.type === 'concept' && node.title === 'GRAPH');
              if (isRoot) return 120; // Размер текста в центре (увеличен в 2 раза)
              if (node.type === 'course') return 36; // Увеличен в 2 раза
              if (node.type === 'module') return 44; // Увеличен в 2 раза
              if (node.type === 'concept') return 30; // Увеличен в 2 раза
              return 24; // Увеличен в 2 раза
            };
            const sourceRadius = getNodeRadius(source);
            const targetRadius = getNodeRadius(target);
            const startPad = sourceRadius + 2;
            const endPad = targetRadius + 2;

            // Используем скорректированное направление для начальной точки
            const x1 = source.x + correctedUx * startPad;
            const y1 = source.y + correctedUy * startPad;
            const x2 = target.x - ux * endPad;
            const y2 = target.y - uy * endPad;

            // Curved path control point (perpendicular offset for smooth curve)
            // Используем среднее направление для более плавной кривой
            const midUx = (correctedUx + ux) / 2;
            const midUy = (correctedUy + uy) / 2;
            const midLen = Math.sqrt(midUx * midUx + midUy * midUy) || 1;
            const normalizedMidUx = midUx / midLen;
            const normalizedMidUy = midUy / midLen;
            
            const curvature = Math.min(len * 0.15, 60);
            const cx = (x1 + x2) / 2 + normalizedMidUy * curvature;
            const cy = (y1 + y2) / 2 - normalizedMidUx * curvature;

            return (
              <path
                key={edge.id}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                stroke={style.stroke}
                strokeWidth={isHighlighted ? style.strokeWidth * 1.3 : style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                fill="none"
                strokeLinecap="round"
                opacity={isHighlighted ? 0.85 : 0.5}
                style={{
                  transition: 'all 0.2s ease',
                  filter: isHighlighted ? 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' : 'none',
                }}
              />
            );
            });
          })()}

          {/* Nodes */}
          {nodes.map((node) => {
             // Filter logic
             if (filter === 'completed' && node.status !== 'completed') return null;
             if (filter === 'uncompleted' && node.status === 'completed') return null;

            // Проверка валидности координат
            if (isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
              if (import.meta.env.DEV) {
                console.warn(`Invalid coordinates for node ${node.id}: x=${node.x}, y=${node.y}`);
              }
              return null;
            }

            const isRoot = node.id === 'root' || node.entityId === 'root' || (node.type === 'concept' && node.title === 'GRAPH');
            const colors = getNodeColors(node);
            const isSelected = selectedNode?.id === node.id;

            // Для корневого узла отображаем только текст
            if (isRoot) {
              const fontSize = 240; // Увеличено в 2 раза
              const lineHeight = 280; // Увеличено в 2 раза
              const lines = node.title.split('\n').filter(line => line.trim().length > 0);
              
              return (
                <g
                  key={node.id}
                  className="pointer-events-none"
                >
                  {/* Текст в центре вместо кружка */}
                  {lines.map((line, i) => (
                    <text
                      key={i}
                      x={node.x}
                      y={node.y + i * lineHeight}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#000000"
                      fontSize={fontSize}
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                      fontWeight="900"
                      style={{ 
                        letterSpacing: '0.05em',
                        paintOrder: 'stroke fill',
                        stroke: '#ffffff',
                        strokeWidth: '16px',
                        strokeLinejoin: 'round',
                        filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.2))'
                      }}
                    >
                      {line.toUpperCase()}
                    </text>
                  ))}
                </g>
              );
            }

            // Размеры узлов в зависимости от типа
            let baseSize: number;
            let minRadius: number;
            if (node.type === 'course') {
              baseSize = (node.size || 35) * 2; // Увеличен в 2 раза
              minRadius = 36; // Увеличен в 2 раза
            } else if (node.type === 'module') {
              baseSize = (node.size || 45) * 2; // Увеличен в 2 раза
              minRadius = 44; // Увеличен в 2 раза
            } else if (node.type === 'concept') {
              baseSize = (node.size || 30) * 2; // Увеличен в 2 раза
              minRadius = 30; // Увеличен в 2 раза
            } else {
              baseSize = (node.size || 25) * 2; // Увеличен в 2 раза
              minRadius = 24; // Увеличен в 2 раза
            }
            const radius = Math.max(baseSize / 2, minRadius);

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all"
                onClick={() => handleNodeClick(node)}
              >
                {/* Enhanced node design with better contrast */}
                {/* Selection ring with glow effect */}
                {isSelected && (
                  <>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 8}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth="3"
                      opacity={0.3}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 6}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth="2"
                      opacity={0.5}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                  </>
                )}

                {/* Main node circle with shadow for depth */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? colors.strokeWidth + 1 : colors.strokeWidth}
                  opacity={node.status === 'closed' ? 0.7 : 1}
                  style={{ 
                    transition: 'all 0.2s ease',
                    filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }}
                />
                
                {/* Inner highlight for depth */}
                {node.type === 'course' && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius * 0.7}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    opacity={node.status === 'closed' ? 0.3 : 0.5}
                  />
                )}

                {/* Simple label - text directly below node */}
                <g>
                  {(() => {
                    const selectionRing = isSelected ? 6 : 0;
                    const maxVisualRadius = radius + selectionRing;
                    
                    // Увеличенный размер текста для лучшей читаемости (в 2 раза больше)
                    const fontSize = 180; // Увеличено в 2 раза
                    const lineHeight = 240; // Увеличено в 2 раза
                    const spacing = 200; // Расстояние от узла до текста (увеличено в 2 раза)
                    
                    // Простое разбиение текста на строки (только по \n, без сложной логики)
                    const lines = node.title.split('\n').filter(line => line.trim().length > 0);
                    const totalHeight = lines.length * lineHeight;
                    
                    // Позиция текста прямо под узлом
                    const labelX = node.x;
                    const labelY = node.y + maxVisualRadius + spacing;
                    
                    return (
                      <>
                        {/* Простой текст без блоков и линий - максимально минималистично */}
                        {lines.map((line, i) => (
                          <text
                            key={i}
                            x={labelX}
                            y={labelY + i * lineHeight}
                            textAnchor="middle"
                            fill="#000000"
                            fontSize={fontSize}
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                            fontWeight="700"
                            className="pointer-events-none"
                            style={{ 
                              letterSpacing: '0.03em',
                              paintOrder: 'stroke fill',
                              stroke: '#ffffff',
                              strokeWidth: '12px',
                              strokeLinejoin: 'round',
                              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))'
                            }}
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

      {/* Node details card - improved design */}
      {selectedNode && (
        <Card className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 p-6 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
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