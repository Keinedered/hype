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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';
import { useNavigate } from 'react-router-dom';

interface Lesson {
  id: string;
  module_id: string | null;
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
  description: string;
  order_index: number;
  lesson_ids: string[]; // ID уроков в модуле
}

// 4 фиксированных курса (соответствуют реальным ID из базы данных)
const FIXED_COURSES = [
  { id: 'event-basics', title: 'Основы ивент-менеджмента', track: 'event' },
  { id: 'product-intro', title: 'Введение в продуктовый менеджмент', track: 'digital' },
  { id: 'business-comm', title: 'Основы деловой переписки', track: 'communication' },
  { id: 'graphic-design', title: 'Основы графического дизайна', track: 'design' },
];

export function LessonsBuilder() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isCreateLessonDialogOpen, setIsCreateLessonDialogOpen] = useState(false);
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const [isEditLessonDialogOpen, setIsEditLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [lessonFormData, setLessonFormData] = useState({
    id: '',
    title: '',
    description: '',
    content: '',
    video_url: '',
    video_duration: '',
    content_type: 'text',
    tags: '',
    estimated_time: 0,
  });
  const [moduleFormData, setModuleFormData] = useState({
    id: '',
    course_id: '',
    title: '',
    description: '',
    selectedLessonIds: [] as string[],
  });

  useEffect(() => {
    fetchLessons();
    fetchModules();
  }, []);

  const fetchLessons = async () => {
    try {
      // Получаем все уроки (без фильтра по модулю)
      const data = await adminAPI.lessons.getAll();
      const lessonsList = Array.isArray(data) ? data : [];
      setLessons(lessonsList);
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error);
      toast.error(error.message || 'Ошибка загрузки уроков');
      setLessons([]);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await adminAPI.modules.getAll();
      const modulesList = Array.isArray(data) ? data : [];
      setModules(modulesList);
    } catch (error: any) {
      console.error('Failed to fetch modules:', error);
      setModules([]);
    }
  };

  // Уроки без модуля (свободные)
  const freeLessons = lessons.filter(l => !l.module_id);
  // Уроки в выбранном модуле
  const moduleLessons = selectedModuleId 
    ? lessons.filter(l => l.module_id === selectedModuleId)
    : [];

  const handleCreateLesson = async () => {
    if (!lessonFormData.id || !lessonFormData.id.trim()) {
      toast.error('Введите ID урока');
      return;
    }
    if (!lessonFormData.title || !lessonFormData.title.trim()) {
      toast.error('Введите название урока');
      return;
    }

    try {
      // Создаем урок БЕЗ module_id (null)
      const createData = {
        id: lessonFormData.id.trim(),
        module_id: null, // Урок создается без модуля
        title: lessonFormData.title.trim(),
        description: lessonFormData.description || '',
        content: lessonFormData.content || '',
        video_url: lessonFormData.video_url || null,
        video_duration: lessonFormData.video_duration || null,
        content_type: lessonFormData.content_type,
        tags: lessonFormData.tags || '',
        estimated_time: lessonFormData.estimated_time || 0,
        order_index: freeLessons.length + 1,
      };

      await adminAPI.lessons.create(createData);
      toast.success('Урок успешно создан');
      fetchLessons();
      setIsCreateLessonDialogOpen(false);
      resetLessonForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании урока');
    }
  };

  const handleCreateModule = async () => {
    if (!moduleFormData.id || !moduleFormData.id.trim()) {
      toast.error('Введите ID модуля');
      return;
    }
    if (!moduleFormData.title || !moduleFormData.title.trim()) {
      toast.error('Введите название модуля');
      return;
    }
    if (!moduleFormData.course_id) {
      toast.error('Выберите курс');
      return;
    }
    if (moduleFormData.selectedLessonIds.length === 0) {
      toast.error('Выберите хотя бы один урок для модуля');
      return;
    }

    try {
      // Создаем модуль
      const moduleData = {
        id: moduleFormData.id.trim(),
        course_id: moduleFormData.course_id,
        title: moduleFormData.title.trim(),
        description: moduleFormData.description || '',
        order_index: modules.filter(m => m.course_id === moduleFormData.course_id).length + 1,
        prerequisites: '',
      };

      // Создаем модуль с автоматическим созданием узла графа
      const createdModule = await adminAPI.modules.create(moduleData, {
        createGraphNode: true,
        x: 0, // Автопозиционирование
        y: 0,
      });
      
      // Привязываем уроки к модулю
      for (const lessonId of moduleFormData.selectedLessonIds) {
        await adminAPI.lessons.update(lessonId, {
          module_id: createdModule.id,
        });
      }

      toast.success('Модуль успешно создан и уроки привязаны');
      fetchLessons();
      fetchModules();
      setIsCreateModuleDialogOpen(false);
      resetModuleForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании модуля');
    }
  };

  const resetLessonForm = () => {
    setLessonFormData({
      id: '',
      title: '',
      description: '',
      content: '',
      video_url: '',
      video_duration: '',
      content_type: 'text',
      tags: '',
      estimated_time: 0,
    });
  };

  const resetModuleForm = () => {
    setModuleFormData({
      id: '',
      course_id: '',
      title: '',
      description: '',
      selectedLessonIds: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Конструктор контента</h1>
          <p className="text-gray-400 text-sm">Создавайте уроки, объединяйте их в модули, модули в курсы</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/lessons/new')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-md cursor-pointer"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Plus size={20} />
            Создать урок
          </button>
          <button
            type="button"
            onClick={() => {
              if (freeLessons.length > 0) {
                setIsCreateModuleDialogOpen(true);
              } else {
                toast.info('Сначала создайте хотя бы один урок');
              }
            }}
            disabled={freeLessons.length === 0}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: freeLessons.length > 0 ? '#16a34a' : '#6b7280',
              color: '#ffffff'
            }}
            title={freeLessons.length === 0 ? 'Сначала создайте хотя бы один урок' : 'Создать модуль из свободных уроков'}
          >
            <Package size={20} />
            Создать модуль
          </button>
        </div>
      </div>

      {/* Свободные уроки (без модуля) */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Свободные уроки ({freeLessons.length})</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/lessons/new')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-md cursor-pointer"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Plus size={18} />
            Добавить урок
          </button>
        </div>
        {freeLessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">Нет свободных уроков. Создайте первый урок.</p>
            <button
              type="button"
              onClick={() => navigate('/admin/lessons/new')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-md cursor-pointer"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus size={20} />
              Создать первый урок
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeLessons.map((lesson) => (
              <Card key={lesson.id} className="p-4 bg-gray-800 border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold">{lesson.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400"
                    onClick={async () => {
                      if (confirm('Удалить урок?')) {
                        try {
                          await adminAPI.lessons.delete(lesson.id);
                          toast.success('Урок удален');
                          fetchLessons();
                        } catch (error: any) {
                          toast.error(error.message || 'Ошибка удаления');
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2">{lesson.description || 'Без описания'}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                    {lesson.content_type}
                  </span>
                  {lesson.estimated_time > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                      {lesson.estimated_time} мин
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Модули по курсам */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Модули по курсам</h2>
        {FIXED_COURSES.map((course) => {
          const courseModules = modules.filter(m => m.course_id === course.id);
          return (
            <Card key={course.id} className="p-6 bg-gray-900 border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">{course.title}</h3>
              {courseModules.length === 0 ? (
                <p className="text-gray-400 text-sm">Нет модулей в этом курсе</p>
              ) : (
                <div className="space-y-3">
                  {courseModules.map((module) => {
                    const moduleLessonsList = lessons.filter(l => l.module_id === module.id);
                    return (
                      <Card key={module.id} className="p-4 bg-gray-800 border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-white font-semibold">{module.title}</h4>
                            <p className="text-gray-400 text-sm">{module.description || 'Без описания'}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-400"
                            onClick={async () => {
                              if (confirm('Удалить модуль? Уроки станут свободными.')) {
                                try {
                                  // Освобождаем уроки
                                  for (const lesson of moduleLessonsList) {
                                    await adminAPI.lessons.update(lesson.id, { module_id: null });
                                  }
                                  await adminAPI.modules.delete(module.id);
                                  toast.success('Модуль удален, уроки освобождены');
                                  fetchLessons();
                                  fetchModules();
                                } catch (error: any) {
                                  toast.error(error.message || 'Ошибка удаления');
                                }
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Уроки в модуле ({moduleLessonsList.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {moduleLessonsList.map((lesson) => (
                              <span
                                key={lesson.id}
                                className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded"
                              >
                                {lesson.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Диалог создания урока */}
      <Dialog 
        open={isCreateLessonDialogOpen}
        modal={true}
        onOpenChange={(open) => {
          setIsCreateLessonDialogOpen(open);
          if (!open) {
            resetLessonForm();
          }
        }}
      >
        <DialogContent 
          className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto !z-[9999]"
          style={{ zIndex: 9999, position: 'fixed', opacity: '1', animation: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          onPointerDownOutside={(e) => {
            // Prevent closing on outside click - let user use close button
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Prevent closing on outside click - let user use close button
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Создать урок</DialogTitle>
            <DialogDescription className="text-gray-400">
              Создайте урок. Позже вы сможете объединить уроки в модули.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">ID урока *</Label>
              <Input
                value={lessonFormData.id}
                onChange={(e) => setLessonFormData({ ...lessonFormData, id: e.target.value })}
                placeholder="lesson-1"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Название *</Label>
              <Input
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                placeholder="Название урока"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Описание</Label>
              <Textarea
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-gray-300">Контент</Label>
              <Textarea
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Тип контента</Label>
                <Select
                  value={lessonFormData.content_type}
                  onValueChange={(value) => setLessonFormData({ ...lessonFormData, content_type: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="text">Текст</SelectItem>
                    <SelectItem value="video">Видео</SelectItem>
                    <SelectItem value="interactive">Интерактивный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Время (мин)</Label>
                <Input
                  type="number"
                  value={lessonFormData.estimated_time}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, estimated_time: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="0"
                />
              </div>
            </div>
            {lessonFormData.content_type === 'video' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">URL видео</Label>
                  <Input
                    value={lessonFormData.video_url}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, video_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Длительность видео</Label>
                  <Input
                    value={lessonFormData.video_duration}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, video_duration: e.target.value })}
                    placeholder="00:15:30"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}
            <div>
              <Label className="text-gray-300">Теги (через запятую)</Label>
              <Input
                value={lessonFormData.tags}
                onChange={(e) => setLessonFormData({ ...lessonFormData, tags: e.target.value })}
                placeholder="тег1, тег2, тег3"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateLessonDialogOpen(false);
                  resetLessonForm();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 px-4 py-2 cursor-pointer"
                style={{ borderColor: '#374151', color: '#d1d5db' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateLesson}
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-md cursor-pointer"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <Plus size={18} />
                Создать урок
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания модуля */}
      <Dialog open={isCreateModuleDialogOpen} onOpenChange={(open) => {
        setIsCreateModuleDialogOpen(open);
        if (!open) resetModuleForm();
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать модуль из уроков</DialogTitle>
            <DialogDescription className="text-gray-400">
              Выберите курс и уроки для объединения в модуль.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">ID модуля *</Label>
              <Input
                value={moduleFormData.id}
                onChange={(e) => setModuleFormData({ ...moduleFormData, id: e.target.value })}
                placeholder="module-1"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Курс *</Label>
              <Select
                value={moduleFormData.course_id}
                onValueChange={(value) => setModuleFormData({ ...moduleFormData, course_id: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Выберите курс" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {FIXED_COURSES.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Название модуля *</Label>
              <Input
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                placeholder="Название модуля"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Описание</Label>
              <Textarea
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-gray-300">Выберите уроки для модуля *</Label>
              <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-3 bg-gray-800">
                {freeLessons.length === 0 ? (
                  <p className="text-gray-400 text-sm">Нет свободных уроков</p>
                ) : (
                  <div className="space-y-2">
                    {freeLessons.map((lesson) => (
                      <label
                        key={lesson.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={moduleFormData.selectedLessonIds.includes(lesson.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModuleFormData({
                                ...moduleFormData,
                                selectedLessonIds: [...moduleFormData.selectedLessonIds, lesson.id],
                              });
                            } else {
                              setModuleFormData({
                                ...moduleFormData,
                                selectedLessonIds: moduleFormData.selectedLessonIds.filter(id => id !== lesson.id),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                        />
                        <span className="text-white text-sm">{lesson.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModuleDialogOpen(false);
                  resetModuleForm();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 px-4 py-2 cursor-pointer"
                style={{ borderColor: '#374151', color: '#d1d5db' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateModule}
                disabled={moduleFormData.selectedLessonIds.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-green-600 hover:bg-green-700 text-white px-4 py-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: moduleFormData.selectedLessonIds.length > 0 ? '#16a34a' : '#6b7280',
                  color: '#ffffff'
                }}
              >
                <Package size={18} />
                Создать модуль ({moduleFormData.selectedLessonIds.length} уроков)
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

