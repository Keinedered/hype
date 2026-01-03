import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Save,
  ChevronRight,
  ChevronDown,
  Link2,
  Unlink,
  BookOpen,
  GraduationCap,
  FileText,
  Lightbulb,
  Network,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

// Типы узлов и их иконки
// Уменьшены размеры узлов
const NODE_TYPE_INFO = {
  course: { label: 'Курс', icon: GraduationCap, color: '#2563eb', size: 120 },
  module: { label: 'Модуль', icon: BookOpen, color: '#16a34a', size: 140 },
  lesson: { label: 'Урок', icon: FileText, color: '#ea580c', size: 100 },
  concept: { label: 'Концепт', icon: Lightbulb, color: '#dc2626', size: 80 },
};

// Цвет для обязательных связей
const REQUIRED_EDGE_COLOR = '#000000';

interface Course {
  id: string;
  title: string;
  description?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  module_id: string | null;
  order_index: number;
}

interface GraphConnection {
  sourceId: string;
  targetId: string;
  type?: string;
}

interface GraphEdgeFromAPI {
  id: string;
  source_id: string;
  target_id: string;
  type?: string;
}

// Тип для направления ветвления
type BranchDirection = {
  x: number;
  y: number;
  name: string;
};

// Алгоритм автоматического позиционирования с радиальным размещением в 4 направлениях
function generateHierarchicalLayout(
  courses: Course[],
  modules: Module[],
  lessons: Lesson[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();

  // Константы для позиционирования
  const RADIUS_COURSES = 600; // Радиус размещения курсов от GRAPH (увеличен для предотвращения перекрытий)
  const RADIUS_MODULES = 500; // Радиус размещения модулей от курса (увеличен)
  const RADIUS_LESSONS = 600; // Радиус размещения уроков от модуля (увеличен для предотвращения перекрытий линий)
  const START_X = 1000; // Центр графа по X (смещен для большего пространства)
  const START_Y = 600; // Центр графа по Y (смещен для большего пространства)
  
  // Размеры узлов для проверки коллизий
  const NODE_SIZES = {
    course: { width: 180, height: 70 },
    module: { width: 240, height: 90 },
    lesson: { width: 180, height: 60 },
    concept: { width: 80, height: 40 },
  };
  
  // Функция для проверки пересечения двух прямоугольников
  const checkCollision = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean => {
    const padding = 120; // Увеличенный отступ между узлами для предотвращения перекрытий линий
    return !(
      x1 + w1/2 + padding < x2 - w2/2 ||
      x2 + w2/2 + padding < x1 - w1/2 ||
      y1 + h1/2 + padding < y2 - h2/2 ||
      y2 + h2/2 + padding < y1 - h1/2
    );
  };
  
  // Функция для проверки коллизий с существующими узлами
  const findNonCollidingPosition = (
    desiredX: number,
    desiredY: number,
    nodeWidth: number,
    nodeHeight: number,
    existingNodes: Array<{ x: number; y: number; width: number; height: number }>,
      maxAttempts: number = 50 // Увеличено для уроков
  ): { x: number; y: number } => {
    let x = desiredX;
    let y = desiredY;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      let hasCollision = false;
      
      for (const existing of existingNodes) {
        if (checkCollision(x, y, nodeWidth, nodeHeight, existing.x, existing.y, existing.width, existing.height)) {
          hasCollision = true;
          break;
        }
      }
      
      if (!hasCollision) {
        return { x, y };
      }
      
      // Смещаем позицию по спирали с большим шагом для уроков
      const angle = (attempts * 0.4) * Math.PI; // Более плавная спираль
      const distance = 150 + attempts * 40; // Увеличенное расстояние
      x = desiredX + Math.cos(angle) * distance;
      y = desiredY + Math.sin(angle) * distance;
      attempts++;
    }
    
    // Если не удалось найти позицию, возвращаем исходную
    return { x: desiredX, y: desiredY };
  };
  
  // Основные направления (4 стороны: север, восток, юг, запад)
  const MAIN_DIRECTIONS = [
    { x: 0, y: -1, name: 'north' },   // Север (вверх)
    { x: 1, y: 0, name: 'east' },     // Восток (вправо)
    { x: 0, y: 1, name: 'south' },    // Юг (вниз)
    { x: -1, y: 0, name: 'west' },    // Запад (влево)
  ];
  
  // Функция для получения 3 направлений ветвления относительно основного направления
  const getBranchDirections = (mainDirection: typeof MAIN_DIRECTIONS[number]) => {
    // Для каждого основного направления возвращаем 3 направления ветвления
    if (mainDirection.name === 'north') {
      // Вверх: ветвимся вверх-влево, вверх, вверх-вправо
      return [
        { x: -1, y: -1, name: 'north-west' },  // Вверх-влево
        { x: 0, y: -1, name: 'north' },        // Вверх
        { x: 1, y: -1, name: 'north-east' },   // Вверх-вправо
      ];
    } else if (mainDirection.name === 'south') {
      // Вниз: ветвимся вниз-влево, вниз, вниз-вправо
      return [
        { x: -1, y: 1, name: 'south-west' },   // Вниз-влево
        { x: 0, y: 1, name: 'south' },         // Вниз
        { x: 1, y: 1, name: 'south-east' },    // Вниз-вправо
      ];
    } else if (mainDirection.name === 'east') {
      // Вправо: ветвимся вправо-вверх, вправо, вправо-вниз
      return [
        { x: 1, y: -1, name: 'east-north' },   // Вправо-вверх
        { x: 1, y: 0, name: 'east' },          // Вправо
        { x: 1, y: 1, name: 'east-south' },    // Вправо-вниз
      ];
    } else { // west
      // Влево: ветвимся влево-вверх, влево, влево-вниз
      return [
        { x: -1, y: -1, name: 'west-north' },  // Влево-вверх
        { x: -1, y: 0, name: 'west' },         // Влево
        { x: -1, y: 1, name: 'west-south' },   // Влево-вниз
      ];
    }
  };
  
  // Нормализация вектора для диагональных направлений
  const normalize = (x: number, y: number) => {
    const length = Math.sqrt(x * x + y * y);
    return { x: x / length, y: y / length };
  };
  
  // Функция для определения оптимальной стороны выхода связи из source узла
  // Определяет, с какой стороны source узла должна выходить связь в направлении к target
  const getSourcePosition = (sourceX: number, sourceY: number, targetX: number, targetY: number): Position => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:233',message:'getSourcePosition called',data:{sourceX,sourceY,targetX,targetY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    let result: Position;
    if (absDx > absDy) {
      // Горизонтальное направление: target справа или слева от source
      // Если target справа (dx > 0), source выходит справа
      // Если target слева (dx < 0), source выходит слева
      result = dx > 0 ? Position.Right : Position.Left;
    } else {
      // Вертикальное направление: target сверху или снизу от source
      // Если target снизу (dy > 0), source выходит снизу
      // Если target сверху (dy < 0), source выходит сверху
      result = dy > 0 ? Position.Bottom : Position.Top;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:251',message:'getSourcePosition result',data:{result,dx,dy,absDx,absDy},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return result;
  };
  
  // Функция для определения оптимальной стороны входа связи в target узел
  // Определяет, с какой стороны target узла должна входить связь (противоположная стороне выхода из source)
  const getTargetPosition = (sourceX: number, sourceY: number, targetX: number, targetY: number): Position => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:255',message:'getTargetPosition called',data:{sourceX,sourceY,targetX,targetY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    let result: Position;
    if (absDx > absDy) {
      // Горизонтальное направление
      // Если target справа от source (dx > 0), связь идет справа налево, target входит слева
      // Если target слева от source (dx < 0), связь идет слева направо, target входит справа
      result = dx > 0 ? Position.Left : Position.Right;
    } else {
      // Вертикальное направление
      // Если target снизу от source (dy > 0), связь идет снизу вверх, target входит сверху
      // Если target сверху от source (dy < 0), связь идет сверху вниз, target входит снизу
      result = dy > 0 ? Position.Top : Position.Bottom;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:273',message:'getTargetPosition result',data:{result,dx,dy,absDx,absDy},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return result;
  };
  
  // Функция для размещения курсов в 4 основных направлениях
  const placeCourses = (count: number) => {
    const result: Array<{ x: number; y: number; direction: typeof MAIN_DIRECTIONS[number] }> = [];
    // Размещаем максимум 4 курса в 4 основных направлениях
    for (let i = 0; i < Math.min(count, 4); i++) {
      const direction = MAIN_DIRECTIONS[i];
      const norm = normalize(direction.x, direction.y);
      const x = START_X + norm.x * RADIUS_COURSES;
      const y = START_Y + norm.y * RADIUS_COURSES;
      result.push({ x, y, direction });
    }
    return result;
  };
  
  // Функция для размещения модулей/уроков в 3 направлениях ветвления с проверкой коллизий
  // Функция для размещения уроков равномерно по кругу/вееру от модуля
  const placeLessonsInFan = (
    count: number,
    baseX: number,
    baseY: number,
    parentDirection: typeof MAIN_DIRECTIONS[number],
    radius: number,
    nodeWidth: number,
    nodeHeight: number,
    existingNodes: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    const result: Array<{ x: number; y: number; direction: BranchDirection }> = [];
    
    if (count === 0) return result;
    
    // Определяем базовый угол на основе направления родителя
    let baseAngle = 0;
    if (parentDirection.name === 'north') baseAngle = -Math.PI / 2; // Вверх
    else if (parentDirection.name === 'south') baseAngle = Math.PI / 2; // Вниз
    else if (parentDirection.name === 'east') baseAngle = 0; // Вправо
    else if (parentDirection.name === 'west') baseAngle = Math.PI; // Влево
    
    // Для уроков используем веерное размещение с углом разброса
    // Угол разброса зависит от количества уроков (больше уроков = больше угол)
    const spreadAngle = Math.min(count * 0.4, Math.PI * 0.8); // Максимум 80% от полного круга
    const startAngle = baseAngle - spreadAngle / 2;
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;
    
    // Размещаем уроки равномерно по вееру
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      const desiredX = baseX + Math.cos(angle) * radius;
      const desiredY = baseY + Math.sin(angle) * radius;
      
      // Проверяем коллизии и корректируем позицию
      const position = findNonCollidingPosition(desiredX, desiredY, nodeWidth, nodeHeight, existingNodes);
      
      // Определяем направление для узла на основе финальной позиции
      const dx = position.x - baseX;
      const dy = position.y - baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = distance > 0 ? dx / distance : 0;
      const normalizedDy = distance > 0 ? dy / distance : 0;
      
      // Создаем направление на основе нормализованного вектора
      const direction: BranchDirection = {
        x: normalizedDx,
        y: normalizedDy,
        name: `${parentDirection.name}-branch-${i}`,
      };
      
      result.push({ x: position.x, y: position.y, direction });
      
      // Добавляем размещенный узел в список существующих для следующих проверок
      existingNodes.push({ x: position.x, y: position.y, width: nodeWidth, height: nodeHeight });
    }
    
    return result;
  };
  
  // Функция для размещения модулей в 3 направлениях (оставляем как есть)
  const placeBranches = (
    count: number,
    baseX: number,
    baseY: number,
    parentDirection: typeof MAIN_DIRECTIONS[number],
    radius: number,
    nodeWidth: number,
    nodeHeight: number,
    existingNodes: Array<{ x: number; y: number; width: number; height: number }>
  ) => {
    const result: Array<{ x: number; y: number; direction: BranchDirection }> = [];
    const branchDirections = getBranchDirections(parentDirection);
    
    // Размещаем максимум 3 элемента в 3 направлениях ветвления
    for (let i = 0; i < Math.min(count, 3); i++) {
      const branchDir = branchDirections[i];
      const norm = normalize(branchDir.x, branchDir.y);
      const desiredX = baseX + norm.x * radius;
      const desiredY = baseY + norm.y * radius;
      
      // Проверяем коллизии и корректируем позицию
      const position = findNonCollidingPosition(desiredX, desiredY, nodeWidth, nodeHeight, existingNodes);
      
      result.push({ x: position.x, y: position.y, direction: branchDir });
      
      // Добавляем размещенный узел в список существующих для следующих проверок
      existingNodes.push({ x: position.x, y: position.y, width: nodeWidth, height: nodeHeight });
    }
    
    return result;
  };

  // Уровень 0: Корневой узел GRAPH
  // Устанавливаем sourcePosition и targetPosition для поддержки подключений со всех сторон
  const rootNode: Node = {
    id: 'root',
          type: 'default',
    position: { x: START_X, y: START_Y },
          data: { 
      label: 'GRAPH',
      nodeType: 'concept',
      entity_id: 'root',
      status: 'completed',
          },
          style: {
      background: '#ffffff',
      color: '#000000',
      border: `4px solid ${NODE_TYPE_INFO.concept.color}`,
      borderRadius: '12px',
      padding: '16px',
      width: NODE_TYPE_INFO.concept.size,
      fontSize: '16px',
      fontWeight: 'bold',
      textAlign: 'center',
      cursor: 'pointer',
    },
    // НЕ устанавливаем фиксированные позиции здесь,
    // чтобы ReactFlow использовал позиции из каждого edge индивидуально
  };
  nodes.push(rootNode);
  nodeMap.set('root', rootNode);

  // Список размещенных узлов для проверки коллизий
  const placedNodes: Array<{ x: number; y: number; width: number; height: number }> = [
    { x: START_X, y: START_Y, width: NODE_SIZES.concept.width, height: NODE_SIZES.concept.height }
  ];
  
  // Уровень 1: Курсы (размещаем в 4 основных направлениях от GRAPH: верх, вниз, влево, вправо)
  const courseNodes: Node[] = [];
  const coursePositions = placeCourses(courses.length);
  
  courses.forEach((course, index) => {
    if (index >= coursePositions.length) return; // Пропускаем, если курсов больше 4
    const nodeId = `node-${course.id}`;
    const pos = coursePositions[index];
    
    // Проверяем коллизии и корректируем позицию
    const courseSize = NODE_SIZES.course;
    const position = findNonCollidingPosition(pos.x, pos.y, courseSize.width, courseSize.height, placedNodes);
    const x = position.x;
    const y = position.y;
    
    // Добавляем размещенный курс в список
    placedNodes.push({ x, y, width: courseSize.width, height: courseSize.height });

      // Определяем позиции для узла на основе его положения относительно root
      const nodeSourcePosition = getSourcePosition(START_X, START_Y, x, y);
      const nodeTargetPosition = getTargetPosition(START_X, START_Y, x, y);
      
      const node: Node = {
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: course.title,
          nodeType: 'course',
          entity_id: course.id,
          status: 'open',
        },
        style: {
          background: '#ffffff',
          color: '#000000',
          border: `4px solid ${NODE_TYPE_INFO.course.color}`,
          borderRadius: '12px',
          padding: '16px',
          width: NODE_TYPE_INFO.course.size,
          minWidth: '200px',
          maxWidth: '280px',
          fontSize: '15px',
          fontWeight: 'bold',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'pointer',
        },
        sourcePosition: nodeSourcePosition, // Разрешаем подключения со всех сторон
        targetPosition: nodeTargetPosition,
      };
    courseNodes.push(node);
    nodes.push(node);
    nodeMap.set(nodeId, node);

      // Связь от root к курсу с автоматическим определением оптимальной стороны подключения
      // Используем исходное направление из placeCourses для более точного определения стороны
      const rootPos = { x: START_X, y: START_Y };
      const coursePos = { x, y };
      
      // Определяем сторону на основе исходного направления размещения курса
      // Это более надежно, чем полагаться только на финальные координаты после проверки коллизий
      let sourcePosition: Position;
      let targetPosition: Position;
      
      const direction = pos.direction;
      if (direction.name === 'north') {
        // Курс сверху - связь выходит сверху из root, входит снизу в курс
        sourcePosition = Position.Top;
        targetPosition = Position.Bottom;
      } else if (direction.name === 'south') {
        // Курс снизу - связь выходит снизу из root, входит сверху в курс
        sourcePosition = Position.Bottom;
        targetPosition = Position.Top;
      } else if (direction.name === 'east') {
        // Курс справа - связь выходит справа из root, входит слева в курс
        sourcePosition = Position.Right;
        targetPosition = Position.Left;
      } else { // west
        // Курс слева - связь выходит слева из root, входит справа в курс
        sourcePosition = Position.Left;
        targetPosition = Position.Right;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:430',message:'Creating edge root->course',data:{edgeId:`edge-root-${course.id}`,source:'root',target:nodeId,sourcePosition,targetPosition,rootPos,coursePos,direction:direction.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const edge = {
        id: `edge-root-${course.id}`,
        source: 'root',
        target: nodeId,
        type: 'straight', // Используем straight для прямых линий
        sourcePosition,
        targetPosition,
        style: { stroke: REQUIRED_EDGE_COLOR, strokeWidth: 3 },
        markerEnd: 'arrowclosed',
        animated: false,
        // Явно указываем, что нужно использовать позиции из edge
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:422',message:'Edge created with positions',data:{edgeId:edge.id,hasSourcePosition:edge.sourcePosition !== undefined,hasTargetPosition:edge.targetPosition !== undefined,sourcePosition:edge.sourcePosition,targetPosition:edge.targetPosition,edgeType:edge.type,sourceNode:rootNode.id,sourceNodePosition:rootNode.sourcePosition,targetNode:nodeId,targetNodePosition:nodeMap.get(nodeId)?.sourcePosition},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      edges.push(edge);
  });

  // Уровень 2: Модули (ветвимся в 3 направлениях от каждого курса)
  const moduleNodes: Node[] = [];
  const moduleDirectionMap = new Map<string, typeof MAIN_DIRECTIONS[number]>(); // Сохраняем направление модуля
  
  courses.forEach((course, courseIndex) => {
    if (courseIndex >= coursePositions.length) return;
    const courseModules = modules.filter((m) => m.course_id === course.id);
    const courseNode = nodeMap.get(`node-${course.id}`);
    if (!courseNode || courseModules.length === 0) return;

    // Получаем направление курса
    const courseDirection = coursePositions[courseIndex].direction;
    const courseX = courseNode.position.x;
    const courseY = courseNode.position.y;
    
    // Размещаем модули в 3 направлениях ветвления от курса с проверкой коллизий
    const moduleSize = NODE_SIZES.module;
    const modulePositions = placeBranches(
      courseModules.length,
      courseX,
      courseY,
      courseDirection,
      RADIUS_MODULES,
      moduleSize.width,
      moduleSize.height,
      placedNodes
    );
    
    courseModules.forEach((module, moduleIndex) => {
      if (moduleIndex >= modulePositions.length) return; // Пропускаем, если модулей больше 3
      const nodeId = `node-${module.id}`;
      const pos = modulePositions[moduleIndex];
      const x = pos.x;
      const y = pos.y;
      
      // Сохраняем направление модуля для использования при размещении уроков
      // Используем направление курса, так как модули ветвятся от курса в том же направлении
      moduleDirectionMap.set(module.id, courseDirection);

      // Определяем позиции для узла на основе его положения относительно курса
      const nodeSourcePosition = getSourcePosition(courseX, courseY, x, y);
      const nodeTargetPosition = getTargetPosition(courseX, courseY, x, y);
      
      const node: Node = {
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: module.title,
          nodeType: 'module',
          entity_id: module.id,
          status: 'open',
        },
        style: {
          background: '#ffffff',
          color: '#000000',
          border: `4px solid ${NODE_TYPE_INFO.module.color}`,
          borderRadius: '12px',
          padding: '16px',
          width: NODE_TYPE_INFO.module.size,
          minWidth: '240px',
          maxWidth: '320px',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'pointer',
        },
        sourcePosition: nodeSourcePosition, // Разрешаем подключения со всех сторон
        targetPosition: nodeTargetPosition,
      };
      moduleNodes.push(node);
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Автоматически создаем связь от курса к модулю с оптимальной стороной подключения
      const coursePos = { x: courseX, y: courseY };
      const modulePos = { x, y };
      const sourcePosition = getSourcePosition(coursePos.x, coursePos.y, modulePos.x, modulePos.y);
      const targetPosition = getTargetPosition(coursePos.x, coursePos.y, modulePos.x, modulePos.y);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:499',message:'Creating edge course->module',data:{edgeId:`edge-${course.id}-${module.id}`,source:`node-${course.id}`,target:nodeId,sourcePosition,targetPosition,coursePos,modulePos},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const edge = {
        id: `edge-${course.id}-${module.id}`,
        source: `node-${course.id}`,
        target: nodeId,
        type: 'straight', // Используем straight для прямых линий
        sourcePosition,
        targetPosition,
        style: {
          stroke: REQUIRED_EDGE_COLOR,
          strokeWidth: 3,
        },
        markerEnd: 'arrowclosed',
        animated: false,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:518',message:'Edge created with positions',data:{edgeId:edge.id,hasSourcePosition:edge.sourcePosition !== undefined,hasTargetPosition:edge.targetPosition !== undefined,sourcePosition:edge.sourcePosition,targetPosition:edge.targetPosition,edgeType:edge.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      edges.push(edge);
    });
  });

  // Уровень 3: Уроки (размещаем равномерно по вееру от каждого модуля без пересечений)
  modules.forEach((module) => {
    const moduleLessons = lessons.filter((l) => l.module_id === module.id);
    const moduleNode = nodeMap.get(`node-${module.id}`);
    if (!moduleNode || moduleLessons.length === 0) return;

    const moduleX = moduleNode.position.x;
    const moduleY = moduleNode.position.y;
    
    // Получаем сохраненное направление модуля
    const moduleDirection = moduleDirectionMap.get(module.id);
    if (!moduleDirection) return;
    
    // Размещаем уроки равномерно по вееру от модуля с проверкой коллизий
    const lessonSize = NODE_SIZES.lesson;
    const lessonPositions = placeLessonsInFan(
      moduleLessons.length,
      moduleX,
      moduleY,
      moduleDirection,
      RADIUS_LESSONS,
      lessonSize.width,
      lessonSize.height,
      placedNodes
    );
    
    moduleLessons.forEach((lesson, lessonIndex) => {
      if (lessonIndex >= lessonPositions.length) return; // Пропускаем, если позиций недостаточно
      const nodeId = `node-${lesson.id}`;
      const pos = lessonPositions[lessonIndex];
      const x = pos.x;
      const y = pos.y;

      // Определяем позиции для узла на основе его положения относительно модуля
      const nodeSourcePosition = getSourcePosition(moduleX, moduleY, x, y);
      const nodeTargetPosition = getTargetPosition(moduleX, moduleY, x, y);
      
      const node: Node = {
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: lesson.title,
          nodeType: 'lesson',
          entity_id: lesson.id,
        status: 'open',
        },
        style: {
          background: '#ffffff',
          color: '#000000',
          border: `4px solid ${NODE_TYPE_INFO.lesson.color}`,
          borderRadius: '12px',
          padding: '16px',
          width: NODE_TYPE_INFO.lesson.size,
          minWidth: '180px',
          maxWidth: '260px',
          fontSize: '13px',
          fontWeight: 'normal',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'pointer',
        },
        sourcePosition: nodeSourcePosition, // Разрешаем подключения со всех сторон
        targetPosition: nodeTargetPosition,
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Автоматически создаем связь от модуля к уроку с оптимальной стороной подключения
      const modulePos = { x: moduleX, y: moduleY };
      const lessonPos = { x, y };
      const sourcePosition = getSourcePosition(modulePos.x, modulePos.y, lessonPos.x, lessonPos.y);
      const targetPosition = getTargetPosition(modulePos.x, modulePos.y, lessonPos.x, lessonPos.y);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:591',message:'Creating edge module->lesson',data:{edgeId:`edge-${module.id}-${lesson.id}`,source:`node-${module.id}`,target:nodeId,sourcePosition,targetPosition,modulePos,lessonPos},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const edge = {
        id: `edge-${module.id}-${lesson.id}`,
        source: `node-${module.id}`,
        target: nodeId,
        type: 'straight', // Используем straight для прямых линий
        sourcePosition,
        targetPosition,
        style: {
          stroke: REQUIRED_EDGE_COLOR,
          strokeWidth: 3,
        },
        markerEnd: 'arrowclosed',
        animated: false,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f934cd13-d56f-4483-86ce-e2102f0bc81b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GraphEditor.tsx:610',message:'Edge created with positions',data:{edgeId:edge.id,hasSourcePosition:edge.sourcePosition !== undefined,hasTargetPosition:edge.targetPosition !== undefined,sourcePosition:edge.sourcePosition,targetPosition:edge.targetPosition,edgeType:edge.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      edges.push(edge);
    });
  });

  return { nodes, edges };
}

// Компонент для ReactFlow
function GraphFlowContent({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}) {
  const { fitView } = useReactFlow();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (nodes.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true;
      setTimeout(() => {
        fitView({ padding: 0.5, maxZoom: 1.0 });
      }, 500);
    }
  }, [nodes.length, fitView]);

  return (
    <div style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 1.0 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          className="bg-gray-950"
        nodesDraggable={false}
        nodesConnectable={false}
        edgesUpdatable={false}
        elementsSelectable={true}
        connectionLineType="straight"
        connectionRadius={20}
        defaultEdgeOptions={{
          style: { strokeWidth: 3, stroke: REQUIRED_EDGE_COLOR },
          markerEnd: 'arrowclosed',
          type: 'straight', // Используем straight для прямых линий
          animated: false,
        }}
        snapToGrid={false}
        snapGrid={[15, 15]}
        connectionMode="loose"
        >
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap
            className="bg-gray-800 border-gray-700"
          nodeColor={(node) => {
            const type = node.data?.nodeType || 'concept';
            return NODE_TYPE_INFO[type as keyof typeof NODE_TYPE_INFO]?.color || '#6b7280';
          }}
        />
        <Panel position="top-right" className="bg-gray-900/90 border border-gray-800 rounded-lg p-3">
          <div className="text-sm space-y-2">
            <div className="font-semibold mb-2">Легенда:</div>
            <div className="space-y-1 text-xs">
              {Object.entries(NODE_TYPE_INFO).map(([key, info]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: info.color }}
                  />
                  <span>{info.label}</span>
        </div>
              ))}
            </div>
            </div>
        </Panel>
      </ReactFlow>
            </div>
  );
}

export function GraphEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [coursesData, modulesData, lessonsData] = await Promise.all([
        adminAPI.courses.getAll(),
        adminAPI.modules.getAll(),
        adminAPI.lessons.getAll(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setModules(Array.isArray(modulesData) ? modulesData : []);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);

      // Загружаем существующие связи из графа
      const edgesData = await adminAPI.graph.getEdges();
      const connectionsList: GraphConnection[] = [];
      if (Array.isArray(edgesData)) {
        edgesData.forEach((edge: GraphEdgeFromAPI) => {
          const sourceEntityId = edge.source_id?.replace('node-', '') || '';
          const targetEntityId = edge.target_id?.replace('node-', '') || '';
          if (sourceEntityId && targetEntityId && sourceEntityId !== 'root') {
            connectionsList.push({
              sourceId: sourceEntityId,
              targetId: targetEntityId,
              type: edge.type || 'required',
            });
          }
        });
      }
      setConnections(connectionsList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Ошибка загрузки данных: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Генерация графа на основе данных
  useEffect(() => {
    if (courses.length > 0 || modules.length > 0 || lessons.length > 0) {
      const { nodes: generatedNodes, edges: generatedEdges } = generateHierarchicalLayout(
        courses,
        modules,
        lessons
      );
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    }
  }, [courses, modules, lessons, setNodes, setEdges]);

  // Сохранение графа в БД
  const saveGraph = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Удаляем все существующие узлы и связи
      const existingNodes = await adminAPI.graph.getNodes();
      const existingEdges = await adminAPI.graph.getEdges();
      
      if (Array.isArray(existingEdges)) {
        for (const edge of existingEdges) {
          await adminAPI.graph.deleteEdge(edge.id);
        }
      }
      
      if (Array.isArray(existingNodes)) {
        for (const node of existingNodes) {
          if (node.id !== 'root') {
            await adminAPI.graph.deleteNode(node.id);
          }
        }
      }

      // Создаем новые узлы
      for (const node of nodes) {
        if (node.id === 'root') continue;
        
        const entityId = node.data.entity_id;
        const nodeType = node.data.nodeType;
        
        await adminAPI.graph.createNode({
          id: node.id,
          type: nodeType,
          entity_id: entityId,
          title: node.data.label || '',
          x: node.position.x,
          y: node.position.y,
          status: node.data.status || 'open',
          size: (node.style?.width as number) || 150,
        });
      }

      // Создаем новые связи
      for (const edge of edges) {
        await adminAPI.graph.createEdge({
          id: edge.id,
          source_id: edge.source,
          target_id: edge.target,
          type: 'required',
        });
      }

      toast.success('Граф успешно сохранен');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Ошибка сохранения графа: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, connections]);

  // Управление связями
  const toggleConnection = useCallback((sourceId: string, targetId: string) => {
    setConnections((prev) => {
      const existing = prev.find(
        (c) => c.sourceId === sourceId && c.targetId === targetId
      );
      if (existing) {
        return prev.filter((c) => !(c.sourceId === sourceId && c.targetId === targetId));
      } else {
        return [...prev, { sourceId, targetId }];
      }
    });
  }, []);

  const hasConnection = useCallback((sourceId: string, targetId: string) => {
    return connections.some((c) => c.sourceId === sourceId && c.targetId === targetId);
  }, [connections]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Боковая панель конструктора */}
      <div className="w-96 bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold mb-2">Конструктор связей</h2>
          <p className="text-sm text-gray-400">
            Управляйте обязательными связями между курсами, модулями и уроками
          </p>
        </div>

        <div className="p-4 space-y-4">
          {courses.map((course) => {
            const courseModules = modules.filter((m) => m.course_id === course.id);
            const isExpanded = expandedCourses.has(course.id);

            return (
              <div key={course.id} className="border border-gray-800 rounded-lg p-3 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <GraduationCap size={16} className="text-blue-400" />
                    <span className="font-medium text-sm">{course.title}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 pl-6">
                    {courseModules.map((module) => {
                      const moduleLessons = lessons.filter((l) => l.module_id === module.id);
                      const isModuleExpanded = expandedModules.has(module.id);
                      const hasCourseModuleConnection = hasConnection(course.id, module.id);

                      return (
                        <div key={module.id} className="border border-gray-700 rounded p-2 bg-gray-800/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {isModuleExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <BookOpen size={14} className="text-green-400" />
                              <span className="text-gray-300 text-xs">{module.title}</span>
                            </div>
                            <button
                              onClick={() => toggleConnection(course.id, module.id)}
                              className={`p-1 rounded ${
                                hasCourseModuleConnection
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                              title={hasCourseModuleConnection ? 'Удалить связь' : 'Добавить обязательную связь'}
                            >
                              {hasCourseModuleConnection ? <Unlink size={12} /> : <Link2 size={12} />}
                            </button>
                          </div>

                          {isModuleExpanded && (
                            <div className="mt-2 space-y-1 pl-4">
                              {moduleLessons.map((lesson) => {
                                const hasModuleLessonConnection = hasConnection(module.id, lesson.id);

                                return (
                                  <div key={lesson.id} className="flex items-center justify-between p-1.5 bg-gray-800/50 rounded">
                                    <div className="flex items-center gap-2 flex-1">
                                      <FileText size={12} className="text-orange-400" />
                                      <span className="text-gray-400 text-xs">{lesson.title}</span>
                                    </div>
                                    <button
                                      onClick={() => toggleConnection(module.id, lesson.id)}
                                      className={`p-1 rounded ${
                                        hasModuleLessonConnection
                                          ? 'bg-green-600 text-white'
                                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                      }`}
                                      title={hasModuleLessonConnection ? 'Удалить связь' : 'Добавить обязательную связь'}
                                    >
                                      {hasModuleLessonConnection ? <Unlink size={10} /> : <Link2 size={10} />}
                                    </button>
                                  </div>
                                );
                              })}
              </div>
            )}
                        </div>
                      );
                    })}
              </div>
            )}
              </div>
            );
          })}
              </div>
            </div>

      {/* Основная область с графом */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Граф знаний</h1>
              <p className="text-sm text-gray-400 mt-1">
                Граф генерируется автоматически на основе связей
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" disabled={isLoading}>
                <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={16} />
                Обновить
              </Button>
              <Button onClick={saveGraph} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2" size={16} />
                {isSaving ? 'Сохранение...' : 'Сохранить граф'}
              </Button>
            </div>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800 overflow-hidden m-4 flex-1" style={{ minHeight: '600px' }}>
          <div style={{ width: '100%', height: '100%', minHeight: '600px', position: 'relative' }}>
            <ReactFlowProvider>
              <GraphFlowContent
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
              />
            </ReactFlowProvider>
          </div>
        </Card>
      </div>
    </div>
  );
}
