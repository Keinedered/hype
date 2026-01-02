import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { KnowledgeGraph } from './KnowledgeGraph';
import { graphAPI, modulesAPI } from '../api/client';
import { GraphNode, GraphEdge } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { BookOpen, Bell } from 'lucide-react';

// Алгоритм автоматического расположения узлов
// modulesData - опциональный параметр для загрузки модулей через API, если edges не содержат связей
interface ModuleData {
  id: string;
  course_id: string;
  title: string;
  description?: string;
}

function generateNodeLayout(nodes: GraphNode[], edges: GraphEdge[], modulesData?: ModuleData[]): GraphNode[] {
  // Константы для позиционирования
  // Увеличены расстояния между узлами для лучшей читаемости
  const RADIUS_COURSES = 800;
  const RADIUS_MODULES = 700;
  const RADIUS_LESSONS = 800;
  const START_X = 1000;
  const START_Y = 600;

  // Размеры узлов для проверки коллизий
  // Уменьшены размеры всех узлов
  const NODE_SIZES = {
    concept: { width: 80, height: 40 },
    course: { width: 180, height: 70 },
    module: { width: 240, height: 90 },
    lesson: { width: 180, height: 60 },
  };

  // Функция для проверки пересечения двух прямоугольников
  const checkCollision = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean => {
    const padding = 180; // Увеличено расстояние между узлами
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
    maxAttempts: number = 50
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

      // Смещаем позицию по спирали
      const angle = (attempts * 0.5) * Math.PI;
      const distance = 100 + attempts * 30;
      x = desiredX + Math.cos(angle) * distance;
      y = desiredY + Math.sin(angle) * distance;
      attempts++;
    }

    return { x: desiredX, y: desiredY };
  };

  // Основные направления (4 стороны)
  const MAIN_DIRECTIONS = [
    { x: 0, y: -1, name: 'north' },
    { x: 1, y: 0, name: 'east' },
    { x: 0, y: 1, name: 'south' },
    { x: -1, y: 0, name: 'west' },
  ];

  // Нормализация вектора
  const normalize = (x: number, y: number) => {
    const length = Math.sqrt(x * x + y * y);
    return { x: x / length, y: y / length };
  };

  // Функция для размещения курсов в 4 основных направлениях
  const placeCourses = (count: number) => {
    const result: Array<{ x: number; y: number; direction: typeof MAIN_DIRECTIONS[number] }> = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const direction = MAIN_DIRECTIONS[i];
      const norm = normalize(direction.x, direction.y);
      const x = START_X + norm.x * RADIUS_COURSES;
      const y = START_Y + norm.y * RADIUS_COURSES;
      result.push({ x, y, direction });
    }
    return result;
  };

  // Функция для получения 3 направлений ветвления
  const getBranchDirections = (mainDirection: typeof MAIN_DIRECTIONS[number]) => {
    if (mainDirection.name === 'north') {
      return [
        { x: -1, y: -1, name: 'north-west' },
        { x: 0, y: -1, name: 'north' },
        { x: 1, y: -1, name: 'north-east' },
      ];
    } else if (mainDirection.name === 'south') {
      return [
        { x: -1, y: 1, name: 'south-west' },
        { x: 0, y: 1, name: 'south' },
        { x: 1, y: 1, name: 'south-east' },
      ];
    } else if (mainDirection.name === 'east') {
      return [
        { x: 1, y: -1, name: 'east-north' },
        { x: 1, y: 0, name: 'east' },
        { x: 1, y: 1, name: 'east-south' },
      ];
    } else {
      return [
        { x: -1, y: -1, name: 'west-north' },
        { x: -1, y: 0, name: 'west' },
        { x: -1, y: 1, name: 'west-south' },
      ];
    }
  };

  // Функция для размещения модулей в 3 направлениях
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
    const result: Array<{ x: number; y: number; direction: typeof MAIN_DIRECTIONS[number] }> = [];
    const branchDirections = getBranchDirections(parentDirection);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const branchDir = branchDirections[i];
      const norm = normalize(branchDir.x, branchDir.y);
      const desiredX = baseX + norm.x * radius;
      const desiredY = baseY + norm.y * radius;

      const position = findNonCollidingPosition(desiredX, desiredY, nodeWidth, nodeHeight, existingNodes);
      result.push({ x: position.x, y: position.y, direction: branchDir });

      existingNodes.push({ x: position.x, y: position.y, width: nodeWidth, height: nodeHeight });
    }

    return result;
  };

  // Функция для размещения уроков веером
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
    const result: Array<{ x: number; y: number }> = [];

    if (count === 0) return result;

    let baseAngle = 0;
    if (parentDirection.name === 'north') baseAngle = -Math.PI / 2;
    else if (parentDirection.name === 'south') baseAngle = Math.PI / 2;
    else if (parentDirection.name === 'east') baseAngle = 0;
    else if (parentDirection.name === 'west') baseAngle = Math.PI;

    const spreadAngle = Math.min(count * 0.4, Math.PI * 0.8);
    const startAngle = baseAngle - spreadAngle / 2;
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      const desiredX = baseX + Math.cos(angle) * radius;
      const desiredY = baseY + Math.sin(angle) * radius;

      const position = findNonCollidingPosition(desiredX, desiredY, nodeWidth, nodeHeight, existingNodes);
      result.push({ x: position.x, y: position.y });

      existingNodes.push({ x: position.x, y: position.y, width: nodeWidth, height: nodeHeight });
    }

    return result;
  };

  // Разделяем узлы по типам
  // Уроки не отображаются на графе - они находятся внутри модулей
  const rootNode = nodes.find(n => n.id === 'root' || (n.type === 'concept' && n.title === 'GRAPH'));
  const courseNodes = nodes.filter(n => n.type === 'course');
  const moduleNodes = nodes.filter(n => n.type === 'module');
  // lessonNodes больше не используются для размещения на графе

  // Создаем карту узлов для быстрого доступа
  const nodeMap = new Map<string, GraphNode>();
  const placedNodes: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Размещаем корневой узел
  if (rootNode) {
    const rootSize = NODE_SIZES.concept;
    rootNode.x = START_X;
    rootNode.y = START_Y;
    nodeMap.set(rootNode.id, rootNode);
    placedNodes.push({ x: START_X, y: START_Y, width: rootSize.width, height: rootSize.height });
  }

  // Размещаем курсы
  const coursePositions = placeCourses(courseNodes.length);
  courseNodes.forEach((course, index) => {
    if (index >= coursePositions.length) return;
    const pos = coursePositions[index];
    const courseSize = NODE_SIZES.course;
    const position = findNonCollidingPosition(pos.x, pos.y, courseSize.width, courseSize.height, placedNodes);
    course.x = position.x;
    course.y = position.y;
    nodeMap.set(course.id, course);
    placedNodes.push({ x: position.x, y: position.y, width: courseSize.width, height: courseSize.height });
  });

  // Размещаем модули относительно курсов
  courseNodes.forEach((course, courseIndex) => {
    if (courseIndex >= coursePositions.length) return;
    const courseDirection = coursePositions[courseIndex].direction;
    
    // Находим модули, связанные с этим курсом через edges
    // ID узлов в БД имеют формат: node-${entityId}
    // где entityId - это ID из таблицы courses/modules/lessons
    // Например: course.entityId = "design", course.id = "node-design"
    const courseNodeId = course.id.startsWith('node-') ? course.id : `node-${course.entityId || course.id}`;
    const courseEntityId = course.entityId || (course.id.startsWith('node-') ? course.id.replace('node-', '') : course.id);
    
    const courseModules = moduleNodes.filter(module => {
      const moduleNodeId = module.id.startsWith('node-') ? module.id : `node-${module.entityId || module.id}`;
      const moduleEntityId = module.entityId || (module.id.startsWith('node-') ? module.id.replace('node-', '') : module.id);
      
      // Проверяем связь курс -> модуль через edges
      // В БД связи создаются как: source_id = course_node.id (node-${course.entityId}), target_id = module_node.id (node-${module.entityId})
      const hasEdge = edges.some(edge => {
        // Основной вариант: связь через node- префикс
        if (edge.sourceId === courseNodeId && edge.targetId === moduleNodeId) {
          return true;
        }
        
        // Альтернативные варианты для совместимости
        if (edge.sourceId === course.id && edge.targetId === module.id) return true;
        if (edge.sourceId === `node-${courseEntityId}` && edge.targetId === `node-${moduleEntityId}`) return true;
        if (edge.sourceId === courseEntityId && edge.targetId === moduleEntityId) return true;
        
        return false;
      });
      
      // Если связь через edges не найдена, проверяем через modulesData (API)
      if (!hasEdge && modulesData && modulesData.length > 0) {
        const moduleFromAPI = modulesData.find(m => {
          const moduleId = m.id || m.module_id;
          return moduleId === moduleEntityId;
        });
        
        if (moduleFromAPI) {
          const moduleCourseId = moduleFromAPI.course_id || moduleFromAPI.courseId;
          if (moduleCourseId === courseEntityId) {
            return true;
          }
        }
      }
      
      return hasEdge;
    });

    if (courseModules.length === 0) {
      return;
    }


    const moduleSize = NODE_SIZES.module;
    const modulePositions = placeBranches(
      courseModules.length,
      course.x,
      course.y,
      courseDirection,
      RADIUS_MODULES,
      moduleSize.width,
      moduleSize.height,
      placedNodes
    );

    courseModules.forEach((module, moduleIndex) => {
      if (moduleIndex >= modulePositions.length) return;
      const pos = modulePositions[moduleIndex];
      module.x = pos.x;
      module.y = pos.y;
      nodeMap.set(module.id, module);
      // Добавляем модуль в placedNodes для проверки коллизий
      placedNodes.push({ 
        x: pos.x, 
        y: pos.y, 
        width: moduleSize.width, 
        height: moduleSize.height 
      });
    });
  });

  // Уроки не размещаются на графе - они находятся внутри модулей
  // Возвращаем только root, курсы и модули с обновленными координатами
  const visibleNodes = [rootNode, ...courseNodes, ...moduleNodes].filter(Boolean) as GraphNode[];
  return visibleNodes.map(node => nodeMap.get(node.id) || node);
}

interface KnowledgeGraphPageProps {
  onNodeClick?: (nodeId: string) => void;
  onOpenHandbook?: () => void;
}

export function KnowledgeGraphPage({ onNodeClick, onOpenHandbook }: KnowledgeGraphPageProps) {
  const [viewFilter, setViewFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  interface ModuleListItem {
    id: string;
    title: string;
    description: string;
    progress: number;
  }
  const [modules, setModules] = useState<ModuleListItem[]>([]);

  // Загрузка данных графа из API
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setIsLoading(true);
        const [nodesData, edgesData] = await Promise.all([
          graphAPI.getNodes(),
          graphAPI.getEdges(),
        ]);

        // Преобразуем данные из API в формат GraphNode с валидацией координат
        interface ApiNode {
          id?: string;
          x?: number;
          y?: number;
          title?: string;
          type?: string;
          status?: string;
          entity_id?: string;
          entityId?: string;
          size?: number;
        }
        const nodes: GraphNode[] = Array.isArray(nodesData)
          ? nodesData
              .map((node: ApiNode) => {
                const x = typeof node.x === 'number' && !isNaN(node.x) && isFinite(node.x) ? node.x : 0;
                const y = typeof node.y === 'number' && !isNaN(node.y) && isFinite(node.y) ? node.y : 0;
                return {
                  id: node.id || '',
                  x,
                  y,
                  title: node.title || '',
                  type: (node.type || 'concept') as GraphNode['type'],
                  status: (node.status || 'open') as GraphNode['status'],
                  entityId: node.entity_id || node.entityId || '',
                  size: typeof node.size === 'number' ? node.size : undefined,
                };
              })
              .filter((node: GraphNode) => node.id !== '') // Фильтруем узлы без ID
          : [];

        // Преобразуем данные из API в формат GraphEdge с валидацией
        interface ApiEdge {
          id?: string;
          source_id?: string;
          sourceId?: string;
          target_id?: string;
          targetId?: string;
          type?: string;
        }
        const edges: GraphEdge[] = Array.isArray(edgesData)
          ? edgesData
              .map((edge: ApiEdge) => ({
                id: edge.id || '',
                sourceId: edge.source_id || edge.sourceId || '',
                targetId: edge.target_id || edge.targetId || '',
                type: (edge.type || 'required') as GraphEdge['type'],
              }))
              .filter((edge: GraphEdge) => edge.id && edge.sourceId && edge.targetId) // Фильтруем невалидные связи
          : [];

        // Загружаем модули через API для альтернативного способа поиска связей
        let modulesData: ModuleData[] = [];
        try {
          const courseIds = nodes.filter(n => n.type === 'course').map(n => {
            const entityId = n.entityId || n.id.replace('node-', '');
            return entityId;
          });
          
          const modulesPromises = courseIds.map(async (courseId) => {
            try {
              const modules = await modulesAPI.getByCourseId(courseId);
              return Array.isArray(modules) ? modules.map((m: any) => ({
                id: m.id,
                course_id: m.course_id || courseId,
                title: m.title,
                description: m.description
              })) : [];
            } catch (error) {
              return [];
            }
          });
          
          const modulesArrays = await Promise.all(modulesPromises);
          modulesData = modulesArrays.flat().filter(Boolean);
        } catch (error) {
          // Silently fail - modulesData will be empty
        }

        // Фильтруем узлы - убираем уроки, они не отображаются на графе
        const filteredNodes = nodes.filter(node => node.type !== 'lesson');
        
        // Фильтруем edges - убираем связи с уроками
        const filteredEdges = edges.filter(edge => {
          const sourceNode = nodes.find(n => n.id === edge.sourceId || n.id === edge.sourceId.replace('node-', ''));
          const targetNode = nodes.find(n => n.id === edge.targetId || n.id === edge.targetId.replace('node-', ''));
          // Оставляем только edges между root, курсами и модулями
          return sourceNode && targetNode && 
                 sourceNode.type !== 'lesson' && 
                 targetNode.type !== 'lesson';
        });
        
        // Применяем алгоритм автоматического расположения узлов (только root, курсы и модули)
        const positionedNodes = generateNodeLayout(filteredNodes, filteredEdges, modulesData);

        setGraphNodes(positionedNodes);
        setGraphEdges(filteredEdges);

        // Извлекаем модули из узлов типа 'module' (используем positionedNodes)
        const moduleNodes = positionedNodes.filter((n) => n.type === 'module');
        setModules(
          moduleNodes.map((node) => ({
            id: node.entityId || node.id,
            title: node.title,
            description: '',
            progress: node.status === 'completed' ? 100 : 0,
          }))
        );
      } catch (error) {
        // Ошибка загрузки данных графа
        // Устанавливаем пустые данные при ошибке
        setGraphNodes([]);
        setGraphEdges([]);
        setModules([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGraphData();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8 relative inline-block">
          <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
            <h1 className="mb-0">МОЙ ПУТЬ / КАРТА ЗНАНИЙ</h1>
          </div>
          <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
          <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-12rem)]">
          {/* Left panel */}
          <div className="space-y-6 overflow-y-auto">
            {/* Course card */}
            <Card 
              className="p-6 space-y-5 border-2 border-black bg-white relative"
            >
              {/* Removed decorative corner per request */}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="bg-black text-white px-3 py-1 inline-block mb-2 font-mono text-xs tracking-wide">
                    КУРС
                  </div>
                  <h3 className="font-mono tracking-wide mb-1">
                    ВВЕДЕНИЕ В ПРОДУКТОВЫЙ МЕНЕДЖМЕНТ
                  </h3>
                  <span className="text-sm text-muted-foreground font-mono">v1.0</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 bg-white border-2 border-black p-4">
                <div className="flex justify-between font-mono text-sm">
                  <span>ПРОГРЕСС ПО КУРСУ</span>
                  <span className="font-bold">35%</span>
                </div>
                <div className="relative h-2 bg-white border border-black">
                  <div 
                    className="absolute top-0 left-0 h-full transition-all"
                    style={{ 
                      backgroundColor: '#000000',
                      width: '35%'
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t-2 border-black pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onOpenHandbook}
                  className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  ХЕНДБУК
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
                >
                  О КУРСЕ
                </Button>
              </div>
            </Card>

            {/* Modules list */}
            <Card className="p-6 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block mb-4 font-mono text-sm tracking-wide">
                СПИСОК МОДУЛЕЙ
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {modules.map((module, index) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border-2 border-black bg-white"
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center font-mono font-bold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm font-mono tracking-wide">{module.title.toUpperCase()}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 pb-3 space-y-3 border-t-2 border-black pt-3">
                        {module.progress !== undefined && (
                          <div className="flex items-center gap-3">
                            <div className="relative h-2 flex-1 bg-white border border-black">
                              <div 
                                className="absolute top-0 left-0 h-full transition-all"
                                style={{ 
                                  backgroundColor: '#000000',
                                  width: `${module.progress}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold">
                              {module.progress}%
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            {/* Display options */}
            <Card className="p-6 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block mb-4 font-mono text-sm tracking-wide">
                ОТОБРАЖЕНИЕ
              </div>
              <div className="space-y-3 text-sm font-mono">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'all'}
                    onChange={() => setViewFilter('all')}
                    className="accent-black" 
                  />
                  <span>ПОЛНАЯ КАРТА</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'completed'}
                    onChange={() => setViewFilter('completed')}
                    className="accent-black" 
                  />
                  <span>ТОЛЬКО ПРОЙДЕННОЕ</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'uncompleted'}
                    onChange={() => setViewFilter('uncompleted')}
                    className="accent-black" 
                  />
                  <span>ТОЛЬКО НЕПРОЙДЕННОЕ</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Right panel - Graph */}
          <div className="h-full relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full border-2 border-black bg-white">
                <div className="text-center">
                  <div className="text-lg font-mono mb-2">Загрузка графа...</div>
                  <div className="text-sm text-muted-foreground">Пожалуйста, подождите</div>
                </div>
              </div>
            ) : graphNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full border-2 border-black bg-white">
                <div className="text-center">
                  <div className="text-lg font-mono mb-2">Граф пуст</div>
                  <div className="text-sm text-muted-foreground">Нет данных для отображения. Создайте узлы в редакторе графа.</div>
                </div>
              </div>
            ) : (
              <KnowledgeGraph 
                nodes={graphNodes}
                edges={graphEdges}
                filter={viewFilter}
                onNodeClick={onNodeClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}