import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
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
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI, checkServerHealth } from '@/api/adminClient';

export function GraphEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    id: '',
    title: '',
    type: 'course',
    entity_id: '',
    x: 0,
    y: 0,
  });
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [isEdgeTypeDialogOpen, setIsEdgeTypeDialogOpen] = useState(false);
  const [selectedEdgeType, setSelectedEdgeType] = useState<'required' | 'alternative' | 'recommended'>('required');
  const [moduleLessonCounts, setModuleLessonCounts] = useState<Record<string, number>>({});
  const [modules, setModules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const hasLoadedRef = useRef(false);

  // Вспомогательные функции должны быть определены до их использования
  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      track: '#7c3aed',
      course: '#2563eb',
      module: '#16a34a',
      lesson: '#ea580c',
      concept: '#dc2626',
    };
    return colors[type] || '#6b7280';
  };

  const getEdgeColor = (type: string) => {
    const colors: Record<string, string> = {
      required: '#ef4444',
      alternative: '#eab308',
      recommended: '#22c55e',
    };
    return colors[type] || '#6b7280';
  };

  const loadGraph = useCallback(async () => {
    try {
      // Проверяем доступность сервера
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        toast.error('Сервер недоступен. Проверьте, что backend запущен на http://localhost:8000');
        return;
      }

      const [nodesData, edgesData] = await Promise.all([
        adminAPI.graph.getNodes().catch(() => []),
        adminAPI.graph.getEdges().catch(() => []),
      ]);

      // Загружаем количество уроков для модулей и списки модулей/курсов
      let counts: Record<string, number> = {};
      try {
        const modulesList = await adminAPI.modules.getAll().catch(() => []);
        setModules(Array.isArray(modulesList) ? modulesList : []);
        
        for (const module of modulesList) {
          const lessons = await adminAPI.lessons.getAll({ module_id: module.id }).catch(() => []);
          counts[module.id] = Array.isArray(lessons) ? lessons.length : 0;
        }
        setModuleLessonCounts(counts);
        
        const coursesList = await adminAPI.courses.getAll().catch(() => []);
        setCourses(Array.isArray(coursesList) ? coursesList : []);
      } catch (error) {
        console.error('Failed to load module lesson counts:', error);
      }

      // Convert to ReactFlow format
      const flowNodes = (Array.isArray(nodesData) ? nodesData : []).map((n: any) => {
        const nodeType = n.type;
        const lessonCount = nodeType === 'module' && n.entity_id ? (counts[n.entity_id] || 0) : 0;
        const label = nodeType === 'module' && lessonCount > 0
          ? `${n.title || n.id}\n(${lessonCount} уроков)`
          : n.title || n.id;
        
        return {
          id: n.id,
          type: 'default',
          position: { x: n.x || 0, y: n.y || 0 },
          data: { 
            label,
            nodeType,
            entity_id: n.entity_id,
            lessonCount: nodeType === 'module' ? lessonCount : undefined,
          },
          style: {
            background: getNodeColor(nodeType),
            color: 'white',
            border: nodeType === 'course' ? '3px solid #ffffff' : nodeType === 'module' ? '2px solid #ffffff' : '2px solid #1e293b',
            borderRadius: nodeType === 'course' ? '12px' : '8px',
            padding: nodeType === 'course' ? '15px' : nodeType === 'module' ? '12px' : '10px',
            width: n.size || (nodeType === 'course' ? 200 : nodeType === 'module' ? 180 : 150),
            fontSize: nodeType === 'course' ? '16px' : nodeType === 'module' ? '14px' : '12px',
            fontWeight: nodeType === 'course' ? 'bold' : nodeType === 'module' ? '600' : 'normal',
            textAlign: 'center' as const,
            whiteSpace: 'pre-line' as const,
          },
        };
      });

      const flowEdges = (Array.isArray(edgesData) ? edgesData : []).map((e: any) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        type: e.type === 'required' ? 'default' : 'smoothstep',
        animated: e.type === 'recommended',
        style: {
          stroke: getEdgeColor(e.type),
          strokeWidth: 3,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error: any) {
      console.error('Failed to load graph:', error);
      
      // Если ошибка авторизации, перенаправляем на главную страницу
      if (error.message && error.message.includes('Unauthorized')) {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        toast.error('Требуется авторизация. Перенаправление на главную страницу...');
      } else {
        toast.error(error.message || 'Ошибка загрузки графа');
      }
    }
  }, [setNodes, setEdges]);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить узел?')) return;

    try {
      await adminAPI.graph.deleteNode(nodeId);
      toast.success('Узел удален');
      loadGraph();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления узла');
    }
  }, [loadGraph]);

  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить связь?')) return;

    try {
      await adminAPI.graph.deleteEdge(edgeId);
      toast.success('Связь удалена');
      loadGraph();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления связи');
    }
  }, [loadGraph]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadGraph();
    }
  }, [loadGraph]);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Сохраняем соединение и открываем диалог выбора типа
      setPendingConnection(connection);
      setIsEdgeTypeDialogOpen(true);
    },
    []
  );

  const handleCreateEdge = useCallback(async () => {
    if (!pendingConnection) return;

    if (!pendingConnection.source || !pendingConnection.target) {
      toast.error('Необходимо указать источник и цель связи');
      return;
    }

    try {
      const edgeId = `edge-${Date.now()}`;
      await adminAPI.graph.createEdge({
        id: edgeId,
        source_id: pendingConnection.source,
        target_id: pendingConnection.target,
        type: selectedEdgeType,
      });
      // Перезагружаем граф вместо обновления локального состояния для синхронизации
      loadGraph();
      toast.success('Связь создана');
      setIsEdgeTypeDialogOpen(false);
      setPendingConnection(null);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания связи');
    }
  }, [pendingConnection, selectedEdgeType, loadGraph]);

  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      try {
        await adminAPI.graph.updateNode(node.id, {
          x: node.position.x,
          y: node.position.y,
        });
      } catch (error: any) {
        console.error('Failed to update node position:', error);
        toast.error(error.message || 'Ошибка обновления позиции узла');
      }
    },
    []
  );

  const handleCreateNode = async () => {
    // Валидация
    if (!nodeForm.id || !nodeForm.id.trim()) {
      toast.error('Введите ID узла');
      return;
    }
    if (!nodeForm.title || !nodeForm.title.trim()) {
      toast.error('Введите название узла');
      return;
    }

    try {
      await adminAPI.graph.createNode({
        id: nodeForm.id.trim(),
        title: nodeForm.title.trim(),
        type: nodeForm.type,
        entity_id: nodeForm.entity_id.trim() || null,
        x: nodeForm.x || 0,
        y: nodeForm.y || 0,
        status: 'open',
        size: 150,
      });
      toast.success('Узел создан');
      loadGraph();
      setIsNodeDialogOpen(false);
      setNodeForm({ id: '', title: '', type: 'course', entity_id: '', x: 0, y: 0 });
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания узла');
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-white">Редактор графа знаний</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsNodeDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2" size={20} />
            Добавить узел
          </Button>
          <Button onClick={loadGraph} variant="outline">
            <Save className="mr-2" size={20} />
            Обновить
          </Button>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800 overflow-hidden flex-1" style={{ minHeight: '600px' }}>
        <div className="w-full h-full" style={{ minHeight: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={(edgesToDelete) => {
            edgesToDelete.forEach((edge) => {
              handleDeleteEdge(edge.id);
            });
          }}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={(nodesToDelete) => {
            nodesToDelete.forEach((node) => {
              handleDeleteNode(node.id);
            });
          }}
          fitView
          className="bg-gray-950"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap
            className="bg-gray-800 border-gray-700"
            nodeColor={(node) => getNodeColor(node.data.nodeType)}
          />
        </ReactFlow>
        </div>
      </Card>

      {/* Create Node Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Создать узел</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID узла *</Label>
              <Input
                value={nodeForm.id}
                onChange={(e) => setNodeForm({ ...nodeForm, id: e.target.value })}
                placeholder="node-1"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={nodeForm.title}
                onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                placeholder="React Basics"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-200">Тип *</Label>
              <Select value={nodeForm.type} onValueChange={(value) => {
                setNodeForm({ ...nodeForm, type: value, entity_id: '', id: '', title: '' });
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                  <SelectItem value="track" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Track</SelectItem>
                  <SelectItem value="course" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Course</SelectItem>
                  <SelectItem value="module" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Module</SelectItem>
                  <SelectItem value="lesson" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Lesson</SelectItem>
                  <SelectItem value="concept" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {nodeForm.type === 'module' && (
              <div>
                <Label className="text-gray-200">Выберите модуль *</Label>
                <Select
                  value={nodeForm.entity_id}
                  onValueChange={(value) => {
                    const selectedModule = modules.find(m => m.id === value);
                    if (selectedModule) {
                      setNodeForm({
                        ...nodeForm,
                        entity_id: selectedModule.id,
                        id: `node-${selectedModule.id}`,
                        title: selectedModule.title,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Выберите модуль" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id} className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-gray-500 text-xs mt-1">Выберите модуль для создания узла графа</p>
              </div>
            )}
            
            {nodeForm.type === 'course' && (
              <div>
                <Label className="text-gray-200">Выберите курс</Label>
                <Select
                  value={nodeForm.entity_id}
                  onValueChange={(value) => {
                    const selectedCourse = courses.find(c => c.id === value);
                    if (selectedCourse) {
                      setNodeForm({
                        ...nodeForm,
                        entity_id: selectedCourse.id,
                        id: `node-${selectedCourse.id}`,
                        title: selectedCourse.title,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Выберите курс (необязательно)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    <SelectItem value="" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Без привязки</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {nodeForm.type !== 'module' && nodeForm.type !== 'course' && (
              <div>
                <Label className="text-gray-200">Entity ID</Label>
                <Input
                  value={nodeForm.entity_id}
                  onChange={(e) => setNodeForm({ ...nodeForm, entity_id: e.target.value })}
                  placeholder="course-react-basics"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">ID связанной сущности (курс, модуль, урок и т.д.)</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-200">X позиция</Label>
                <Input
                  type="number"
                  value={nodeForm.x}
                  onChange={(e) => setNodeForm({ ...nodeForm, x: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-200">Y позиция</Label>
                <Input
                  type="number"
                  value={nodeForm.y}
                  onChange={(e) => setNodeForm({ ...nodeForm, y: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <Button onClick={handleCreateNode} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5">
              Создать узел
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edge Type Selection Dialog */}
      <Dialog open={isEdgeTypeDialogOpen} onOpenChange={setIsEdgeTypeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Выберите тип связи</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">Тип связи *</Label>
              <Select
                value={selectedEdgeType}
                onValueChange={(value: 'required' | 'alternative' | 'recommended') =>
                  setSelectedEdgeType(value)
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                  <SelectItem value="required" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Обязательная (required)</SelectItem>
                  <SelectItem value="alternative" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Альтернативная (alternative)</SelectItem>
                  <SelectItem value="recommended" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Рекомендуемая (recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEdgeTypeDialogOpen(false);
                  setPendingConnection(null);
                }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                Отмена
              </Button>
              <Button onClick={handleCreateEdge} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Создать связь
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
