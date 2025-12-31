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
import { Plus, Edit, Trash2, BookOpen, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  video_duration?: string;
  order_index: number;
  content_type: string;
  tags?: string;
  estimated_time: number;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
}

export function LessonsManagement() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [formData, setFormData] = useState({
    id: '',
    module_id: '',
    title: '',
    description: '',
    content: '',
    video_url: '',
    video_duration: '',
    order_index: 0,
    content_type: 'text',
    tags: '',
    estimated_time: 0,
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
    if (selectedCourseId) {
      fetchModules();
    } else {
      setModules([]);
      setLessons([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedModuleId) {
      fetchLessons();
    } else if (selectedCourseId) {
      // Если выбран курс, но не модуль, показываем все уроки курса
      fetchLessons();
    } else {
      setLessons([]);
    }
  }, [selectedModuleId, selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.courses.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast.error(error.message || 'Ошибка загрузки курсов');
    }
  };

  const fetchModules = async () => {
    try {
      const data = await adminAPI.modules.getAll(selectedCourseId || undefined);
      const modulesList = Array.isArray(data) ? data : [];
      setModules(modulesList);
      // Если выбранный модуль не существует в новом списке, сбросим его
      if (selectedModuleId && !modulesList.find((m: Module) => m.id === selectedModuleId)) {
        setSelectedModuleId('');
      }
    } catch (error: any) {
      console.error('Failed to fetch modules:', error);
      toast.error(error.message || 'Ошибка загрузки модулей');
      setModules([]);
    }
  };

  const fetchLessons = async () => {
    try {
      const data = await adminAPI.lessons.getAll(selectedModuleId ? { module_id: selectedModuleId } : undefined);
      let filteredLessons = Array.isArray(data) ? data : [];
      
      // Если выбран курс, но не модуль, фильтруем уроки по модулям курса
      if (selectedCourseId && !selectedModuleId) {
        const courseModuleIds = getModulesForCourse(selectedCourseId).map(m => m.id);
        filteredLessons = filteredLessons.filter((lesson: Lesson) => 
          courseModuleIds.includes(lesson.module_id)
        );
      }
      
      // Сортируем по order_index
      filteredLessons.sort((a: Lesson, b: Lesson) => (a.order_index || 0) - (b.order_index || 0));
      setLessons(filteredLessons);
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error);
      // Не показываем ошибку, если просто нет данных
      if (error.message && !error.message.includes('404')) {
        toast.error(error.message || 'Ошибка загрузки уроков');
      }
      setLessons([]);
    }
  };

  const handleCreate = async () => {
    // Валидация обязательных полей
    if (!formData.id || !formData.id.trim()) {
      toast.error('Введите ID урока');
      return;
    }
    if (!formData.module_id) {
      toast.error('Выберите модуль');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название урока');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      toast.error('Введите описание урока');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      toast.error('Введите контент урока');
      return;
    }

    try {
      // Автоматически определяем order_index, если не указан
      const orderIndex = formData.order_index || getNextOrderIndex();
      
      await adminAPI.lessons.create(
        {
          id: formData.id.trim(),
          module_id: formData.module_id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          video_url: formData.video_url?.trim() || null,
          video_duration: formData.video_duration?.trim() || null,
          tags: formData.tags?.trim() || null,
          order_index: orderIndex,
          content_type: formData.content_type,
          estimated_time: formData.estimated_time || 0,
        },
        {
          createGraphNode: graphOptions.createGraphNode,
          x: graphOptions.x,
          y: graphOptions.y,
        }
      );
      toast.success('Урок успешно создан');
      fetchLessons();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.message || 'Ошибка при создании урока');
    }
  };

  const handleUpdate = async () => {
    if (!editingLesson) return;

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        video_url: formData.video_url?.trim() || null,
        video_duration: formData.video_duration?.trim() || null,
        order_index: formData.order_index,
        content_type: formData.content_type,
        tags: formData.tags?.trim() || null,
        estimated_time: formData.estimated_time || 0,
      };
      
      await adminAPI.lessons.update(editingLesson.id, updateData);
      toast.success('Урок успешно обновлен');
      fetchLessons();
      setEditingLesson(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении урока');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить урок? Это действие нельзя отменить.')) return;

    try {
      await adminAPI.lessons.delete(id);
      toast.success('Урок успешно удален');
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении урока');
    }
  };

  const resetForm = () => {
    // Вычисляем следующий индекс только если есть модуль или уроки
    let nextIndex = 1;
    try {
      nextIndex = getNextOrderIndex();
    } catch (e) {
      // Если ошибка, используем значение по умолчанию
      nextIndex = lessons.length + 1;
    }

    setFormData({
      id: '',
      module_id: selectedModuleId || '',
      title: '',
      description: '',
      content: '',
      video_url: '',
      video_duration: '',
      order_index: nextIndex,
      content_type: 'text',
      tags: '',
      estimated_time: 0,
    });
    setGraphOptions({
      createGraphNode: true,
      x: 0,
      y: 0,
    });
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      id: lesson.id,
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      video_duration: lesson.video_duration || '',
      order_index: lesson.order_index || 0,
      content_type: lesson.content_type || 'text',
      tags: lesson.tags || '',
      estimated_time: lesson.estimated_time || 0,
    });
    setIsEditDialogOpen(true);
  };

  // Автоматически определить следующий порядковый номер
  const getNextOrderIndex = () => {
    if (selectedModuleId) {
      const moduleLessons = lessons.filter((l) => l.module_id === selectedModuleId);
      if (moduleLessons.length > 0) {
        const indices = moduleLessons.map((l) => l.order_index || 0);
        return Math.max(...indices) + 1;
      }
    }
    if (lessons.length > 0) {
      const indices = lessons.map((l) => l.order_index || 0);
      return Math.max(...indices) + 1;
    }
    return 1;
  };

  // Получить модули для выбранного курса
  const getModulesForCourse = (courseId: string) => {
    return modules.filter((m) => m.course_id === courseId);
  };

  // Получить модуль по ID
  const getModuleById = (moduleId: string) => {
    return modules.find((m) => m.id === moduleId);
  };

  // Получить курс по ID
  const getCourseById = (courseId: string) => {
    return courses.find((c) => c.id === courseId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление уроками</h1>
          <p className="text-gray-400 text-sm">Создание и редактирование уроков для модулей курсов</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-auto"
              onClick={() => {
                // Сбрасываем форму при открытии диалога
                resetForm();
              }}
            >
              <Plus className="mr-2" size={20} />
              Добавить новый урок
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый урок</DialogTitle>
              <DialogDescription className="text-gray-400">
                Заполните форму для создания нового урока. Урок будет добавлен в выбранный модуль.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Курс и модуль */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Курс *</Label>
                  <Select
                    value={selectedCourseId}
                    onValueChange={(value) => {
                      setSelectedCourseId(value);
                      setSelectedModuleId(''); // Сбрасываем модуль при смене курса
                      setFormData({ ...formData, module_id: '' });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Модуль *</Label>
                  <Select
                    value={formData.module_id}
                    onValueChange={(value) => {
                      setSelectedModuleId(value);
                      // Вычисляем order_index на основе выбранного модуля
                      const moduleLessons = lessons.filter((l) => l.module_id === value);
                      let nextIndex = 1;
                      if (moduleLessons.length > 0) {
                        const indices = moduleLessons.map((l) => l.order_index || 0);
                        nextIndex = Math.max(...indices) + 1;
                      } else if (lessons.length > 0) {
                        const indices = lessons.map((l) => l.order_index || 0);
                        nextIndex = Math.max(...indices) + 1;
                      }
                      setFormData({ 
                        ...formData, 
                        module_id: value,
                        order_index: nextIndex
                      });
                    }}
                    disabled={!selectedCourseId}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder={selectedCourseId ? "Выберите модуль" : "Сначала выберите курс"} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {selectedCourseId && getModulesForCourse(selectedCourseId).length > 0 ? (
                        getModulesForCourse(selectedCourseId).map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-modules" disabled>
                          {selectedCourseId ? "Нет модулей в этом курсе" : "Сначала выберите курс"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCourseId && getModulesForCourse(selectedCourseId).length === 0 && (
                    <p className="text-yellow-500 text-xs mt-1">
                      В этом курсе нет модулей. Сначала создайте модуль в разделе "Модули".
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-200">ID урока *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="lesson-react-jsx"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">Уникальный идентификатор урока (латиница, дефисы)</p>
              </div>

              <div>
                <Label className="text-gray-200">Название *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="JSX в React"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-gray-200">Описание *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание урока..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-gray-200">Контент (Markdown) *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Полный контент урока в формате Markdown..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono text-sm"
                  rows={8}
                />
                <p className="text-gray-500 text-xs mt-1">Поддерживается Markdown форматирование</p>
              </div>

              <div>
                <Label className="text-gray-200">Тип контента</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="text">Текст</SelectItem>
                    <SelectItem value="video">Видео</SelectItem>
                    <SelectItem value="interactive">Интерактивный</SelectItem>
                    <SelectItem value="assignment">Задание</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.content_type === 'video' && (
                <div className="bg-gray-800 p-4 rounded-lg space-y-4 border border-gray-700">
                  <div>
                    <Label className="text-gray-200">URL видео</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... или ссылка на видеофайл"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-200">Длительность видео (MM:SS)</Label>
                    <Input
                      value={formData.video_duration}
                      onChange={(e) =>
                        setFormData({ ...formData, video_duration: e.target.value })
                      }
                      placeholder="15:30"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-gray-500 text-xs mt-1">Определяет порядок урока в модуле</p>
                </div>
                <div>
                  <Label className="text-gray-200">Оценка времени (минуты)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.estimated_time}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 0 })
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-200">Теги (опционально)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder='["react", "jsx", "basics"] или просто через запятую'
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">Теги для поиска и категоризации</p>
              </div>

              {/* Интеграция с графом */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="createGraphNodeLesson"
                    checked={graphOptions.createGraphNode}
                    onChange={(e) =>
                      setGraphOptions({ ...graphOptions, createGraphNode: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="createGraphNodeLesson" className="cursor-pointer text-gray-200">
                    Создать узел графа знаний
                  </Label>
                </div>
                {graphOptions.createGraphNode && (
                  <div className="bg-gray-800/50 p-4 rounded-lg grid grid-cols-2 gap-4 border border-gray-700">
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
                Создать урок
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label className="text-gray-200 mb-2 block">Фильтр по курсу</Label>
            <Select value={selectedCourseId || 'all'} onValueChange={(value) => {
              setSelectedCourseId(value === 'all' ? '' : value);
              setSelectedModuleId('');
            }}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
          {selectedCourseId && (
            <div className="flex-1">
              <Label className="text-gray-200 mb-2 block">Фильтр по модулю</Label>
              <Select value={selectedModuleId || 'all'} onValueChange={(value) => {
                setSelectedModuleId(value === 'all' ? '' : value);
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Все модули" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                  <SelectItem value="all" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Все модули курса</SelectItem>
                  {getModulesForCourse(selectedCourseId)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((module) => (
                    <SelectItem key={module.id} value={module.id} className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {selectedCourseId && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <BookOpen size={16} />
            <span>Курс: {getCourseById(selectedCourseId)?.title}</span>
            {selectedModuleId && (
              <>
                <span>/</span>
                <FolderOpen size={16} />
                <span>Модуль: {getModuleById(selectedModuleId)?.title}</span>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <Card className="p-12 bg-gray-900 border-gray-800 border-2 border-dashed">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">Уроки не найдены</p>
              <p className="text-gray-500 text-sm mb-4">
                {selectedCourseId 
                  ? selectedModuleId 
                    ? 'В этом модуле пока нет уроков' 
                    : 'В этом курсе пока нет уроков'
                  : 'Выберите курс или модуль для просмотра уроков'}
              </p>
              {selectedCourseId && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2" size={18} />
                  Создать урок
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const module = getModuleById(lesson.module_id);
              const course = module ? getCourseById(module.course_id) : null;
              return (
                <Card key={lesson.id} className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-500 text-sm font-mono px-2 py-1 bg-gray-800 rounded">
                              #{lesson.order_index || index + 1}
                            </span>
                            <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
                          </div>
                          {course && module && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <BookOpen size={14} />
                              <span>{course.title}</span>
                              <span>/</span>
                              <FolderOpen size={14} />
                              <span>{module.title}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 ml-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                            onClick={() => openEditDialog(lesson)}
                            title="Редактировать"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            onClick={() => handleDelete(lesson.id)}
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-4 line-clamp-2">{lesson.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-600/30">
                          {lesson.content_type}
                        </span>
                        {lesson.estimated_time > 0 && (
                          <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full border border-purple-600/30">
                            {lesson.estimated_time} мин
                          </span>
                        )}
                        {lesson.video_url && (
                          <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded-full border border-red-600/30">
                            Видео
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать урок</DialogTitle>
            <DialogDescription className="text-gray-400">
              Измените данные урока. ID урока нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID урока</Label>
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
              <Label className="text-gray-200">Описание *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-gray-200">Контент (Markdown) *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono text-sm"
                rows={8}
              />
            </div>
            <div>
              <Label className="text-gray-200">Тип контента</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData({ ...formData, content_type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                  <SelectItem value="text" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Текст</SelectItem>
                  <SelectItem value="video" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Видео</SelectItem>
                  <SelectItem value="interactive" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Интерактивный</SelectItem>
                  <SelectItem value="assignment" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Задание</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.content_type === 'video' && (
              <div className="bg-gray-800/50 p-4 rounded-lg space-y-4 border border-gray-700">
                <div>
                  <Label className="text-gray-200">URL видео</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Длительность видео (MM:SS)</Label>
                  <Input
                    value={formData.video_duration}
                    onChange={(e) =>
                      setFormData({ ...formData, video_duration: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
                <Label className="text-gray-200">Оценка времени (минуты)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.estimated_time}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 0 })
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-200">Теги</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
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

