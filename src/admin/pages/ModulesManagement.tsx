import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, BookOpen, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';
import { useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  prerequisites?: string;
}

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  module_id: string | null;
}

export function ModulesManagement() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    course_id: '',
    title: '',
    description: '',
    order_index: 0,
    prerequisites: '',
  });
  const [graphOptions, setGraphOptions] = useState({
    createGraphNode: true,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedCourseId]);

  const fetchAllLessons = async () => {
    try {
      const lessons = await adminAPI.lessons.getAll();
      setAllLessons(Array.isArray(lessons) ? lessons : []);
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error);
      setAllLessons([]);
    }
  };

  const fetchModuleLessons = async (moduleId: string) => {
    try {
      const lessons = await adminAPI.lessons.getAll({ module_id: moduleId });
      const moduleLessonsList = Array.isArray(lessons) ? lessons : [];
      setModuleLessons(moduleLessonsList);
      setSelectedLessonIds(moduleLessonsList.map((l: Lesson) => l.id));
    } catch (error: any) {
      console.error('Failed to fetch module lessons:', error);
      setModuleLessons([]);
      setSelectedLessonIds([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.courses.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast.error(error.message || 'Ошибка загрузки курсов');
      setCourses([]);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await adminAPI.modules.getAll(selectedCourseId || undefined);
      const modulesList = Array.isArray(data) ? data : [];
      // Сортируем по order_index
      modulesList.sort((a: Module, b: Module) => (a.order_index || 0) - (b.order_index || 0));
      setModules(modulesList);
    } catch (error: any) {
      console.error('Failed to fetch modules:', error);
      // Не показываем ошибку, если просто нет данных
      if (error.message && !error.message.includes('404')) {
        toast.error(error.message || 'Ошибка загрузки модулей');
      }
      setModules([]);
    }
  };

  const handleCreate = async () => {
    // Валидация
    if (!formData.course_id || !formData.course_id.trim()) {
      toast.error('Выберите курс');
      return;
    }
    if (!formData.id || !formData.id.trim()) {
      toast.error('Введите ID модуля');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название модуля');
      return;
    }

    try {
      await adminAPI.modules.create(
        {
          id: formData.id.trim(),
          course_id: formData.course_id,
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          order_index: formData.order_index || getNextOrderIndex(),
          prerequisites: formData.prerequisites?.trim() || null,
        },
        {
          createGraphNode: graphOptions.createGraphNode,
          x: graphOptions.x,
          y: graphOptions.y,
        }
      );
      toast.success('Модуль успешно создан');
      fetchModules();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании модуля');
    }
  };

  const handleUpdate = async () => {
    if (!editingModule) return;

    // Валидация
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название модуля');
      return;
    }

    try {
      // Обновляем уроки модуля
      const currentModuleLessons = await adminAPI.lessons.getAll({ module_id: editingModule.id });
      const currentLessonIds = Array.isArray(currentModuleLessons) 
        ? currentModuleLessons.map((l: Lesson) => l.id)
        : [];
      
      // Удаляем уроки, которые были удалены из модуля
      const lessonsToRemove = currentLessonIds.filter(id => !selectedLessonIds.includes(id));
      for (const lessonId of lessonsToRemove) {
        await adminAPI.lessons.update(lessonId, { module_id: null });
      }
      
      // Добавляем новые уроки в модуль
      const lessonsToAdd = selectedLessonIds.filter(id => !currentLessonIds.includes(id));
      for (const lessonId of lessonsToAdd) {
        await adminAPI.lessons.update(lessonId, { module_id: editingModule.id });
      }

      // Обновляем данные модуля
      const updateData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        order_index: formData.order_index || 0,
        prerequisites: formData.prerequisites?.trim() || null,
      };
      
      await adminAPI.modules.update(editingModule.id, updateData);
      toast.success('Модуль успешно обновлен');
      fetchModules();
      setEditingModule(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении модуля');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить модуль?')) return;

    try {
      await adminAPI.modules.delete(id);
      toast.success('Модуль успешно удален');
      fetchModules();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении модуля');
    }
  };

  const resetForm = () => {
    // Вычисляем следующий индекс только если есть курс или модули
    let nextIndex = 1;
    try {
      nextIndex = getNextOrderIndex();
    } catch (e) {
      // Если ошибка, используем значение по умолчанию
      nextIndex = modules.length + 1;
    }

    setFormData({
      id: '',
      course_id: selectedCourseId || '',
      title: '',
      description: '',
      order_index: nextIndex,
      prerequisites: '',
    });
    setGraphOptions({
      createGraphNode: true,
      x: 0,
      y: 0,
    });
  };

  const openEditDialog = async (module: Module) => {
    setEditingModule(module);
    setFormData({
      id: module.id,
      course_id: module.course_id,
      title: module.title || '',
      description: module.description || '',
      order_index: module.order_index || 0,
      prerequisites: module.prerequisites || '',
    });
    await fetchAllLessons();
    await fetchModuleLessons(module.id);
    setIsEditDialogOpen(true);
  };

  // Автоматически определить следующий порядковый номер
  const getNextOrderIndex = () => {
    if (selectedCourseId) {
      const courseModules = modules.filter((m) => m.course_id === selectedCourseId);
      if (courseModules.length > 0) {
        const indices = courseModules.map((m) => m.order_index || 0);
        return Math.max(...indices) + 1;
      }
    }
    // Если нет модулей или не выбран курс, возвращаем 1
    if (modules.length > 0) {
      const indices = modules.map((m) => m.order_index || 0);
      return Math.max(...indices) + 1;
    }
    return 1;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление модулями</h1>
          <p className="text-gray-400 text-sm">Создание и редактирование модулей курсов</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 h-auto"
          onClick={() => navigate('/admin/modules/new')}
        >
          <Plus className="mr-2" size={20} />
          Создать модуль
        </Button>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-auto"
              onClick={() => resetForm()}
            >
              <Plus className="mr-2" size={20} />
              Добавить новый модуль (старый способ)
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый модуль</DialogTitle>
              <DialogDescription className="text-gray-400">
                Заполните форму для создания нового модуля
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Курс *</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => {
                    // Вычисляем order_index на основе выбранного курса
                    const courseModules = modules.filter((m) => m.course_id === value);
                    let nextIndex = 1;
                    if (courseModules.length > 0) {
                      const indices = courseModules.map((m) => m.order_index || 0);
                      nextIndex = Math.max(...indices) + 1;
                    } else if (modules.length > 0) {
                      const indices = modules.map((m) => m.order_index || 0);
                      nextIndex = Math.max(...indices) + 1;
                    }
                    setFormData({ 
                      ...formData, 
                      course_id: value,
                      order_index: nextIndex
                    });
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Выберите курс" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ID модуля *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="module-react-components"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Название *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Компоненты React"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание модуля..."
                  className="bg-gray-800 border-gray-700"
                  rows={4}
                />
              </div>
              <div>
                <Label>Порядковый номер</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Предварительные требования (JSON массив ID модулей)</Label>
                <Input
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  placeholder='["module-1", "module-2"]'
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {/* Интеграция с графом */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="createGraphNodeModule"
                    checked={graphOptions.createGraphNode}
                    onChange={(e) =>
                      setGraphOptions({ ...graphOptions, createGraphNode: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="createGraphNodeModule" className="cursor-pointer text-gray-200">
                    Создать узел графа знаний
                  </Label>
                </div>
                {graphOptions.createGraphNode && (
                  <div className="bg-gray-800 p-4 rounded-lg grid grid-cols-2 gap-4 border border-gray-700">
                    <div>
                      <Label className="text-gray-200">Координата X</Label>
                      <Input
                        type="number"
                        value={graphOptions.x}
                        onChange={(e) =>
                          setGraphOptions({ ...graphOptions, x: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                      <p className="text-gray-500 text-xs mt-1">0 = автопозиционирование</p>
                    </div>
                    <div>
                      <Label className="text-gray-200">Координата Y</Label>
                      <Input
                        type="number"
                        value={graphOptions.y}
                        onChange={(e) =>
                          setGraphOptions({ ...graphOptions, y: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                      <p className="text-gray-500 text-xs mt-1">0 = автопозиционирование</p>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2">
                Создать модуль
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтр по курсу */}
      <div className="mb-4">
        <Label>Фильтр по курсу</Label>
        <Select value={selectedCourseId || 'all'} onValueChange={(value) => setSelectedCourseId(value === 'all' ? '' : value)}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-64">
            <SelectValue placeholder="Все курсы" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
            <SelectItem value="all" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Все курсы</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id} className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <Card className="p-12 bg-gray-900 border-gray-800 border-2 border-dashed">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">Модули не найдены</p>
              <p className="text-gray-500 text-sm mb-4">
                {selectedCourseId 
                  ? 'В этом курсе пока нет модулей' 
                  : 'Выберите курс для просмотра модулей или создайте новый модуль'}
              </p>
              {selectedCourseId && (
                <Button 
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    setFormData(prev => ({ ...prev, course_id: selectedCourseId }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2" size={18} />
                  Создать модуль
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((module) => {
              const course = courses.find((c) => c.id === module.course_id);
              return (
                <Card key={module.id} className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-500 text-sm font-mono px-2 py-1 bg-gray-800 rounded">
                              #{module.order_index || 0}
                            </span>
                            <h3 className="text-xl font-bold text-white">{module.title}</h3>
                          </div>
                          {course && (
                            <p className="text-sm text-gray-400 mb-2">
                              Курс: {course.title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                            onClick={() => navigate(`/admin/modules/${module.id}/edit`)}
                            title="Редактировать"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            onClick={() => handleDelete(module.id)}
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-4 line-clamp-2">{module.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать модуль</DialogTitle>
            <DialogDescription className="text-gray-400">
              Измените данные модуля. ID модуля нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID модуля</Label>
              <Input value={formData.id} disabled className="bg-gray-800 border-gray-700 text-gray-300 cursor-not-allowed" />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-200">Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                rows={4}
              />
            </div>
            <div>
              <Label className="text-gray-200">Порядковый номер</Label>
              <Input
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-200">Предварительные требования</Label>
              <Input
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Уроки модуля */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-200 text-base font-semibold">Уроки модуля</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/lessons/new')}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Plus size={14} className="mr-1" />
                  Создать урок
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allLessons.filter((lesson) => !lesson.module_id || lesson.module_id === editingModule?.id).map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedLessonIds.includes(lesson.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLessonIds([...selectedLessonIds, lesson.id]);
                          } else {
                            setSelectedLessonIds(selectedLessonIds.filter(id => id !== lesson.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{lesson.title}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-blue-400"
                        onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                      >
                        <Edit size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
                {allLessons.filter((lesson) => !lesson.module_id || lesson.module_id === editingModule?.id).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">Нет доступных уроков</p>
                )}
              </div>
            </div>

            {/* Хендбук и задания для уроков */}
            <div className="border-t border-gray-700 pt-4">
              <Label className="text-gray-200 text-base font-semibold mb-3 block">Хендбук и задания</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {moduleLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3 bg-gray-800 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{lesson.title}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/handbook?lesson_id=${lesson.id}`)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs"
                        >
                          <BookOpen size={12} className="mr-1" />
                          Хендбук
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/assignments?lesson_id=${lesson.id}`)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs"
                        >
                          <ClipboardList size={12} className="mr-1" />
                          Задание
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {moduleLessons.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">Добавьте уроки в модуль для управления хендбуком и заданиями</p>
                )}
              </div>
            </div>

            <Button onClick={handleUpdate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2">
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

