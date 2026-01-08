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
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { FIXED_COURSES } from '../utils/fixedCourses';

interface Lesson {
  id: string;
  module_id: string; // Обязательное поле - урок должен быть привязан к модулю
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

export function LessonsBuilder() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isCreateLessonDialogOpen, setIsCreateLessonDialogOpen] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    id: '',
    module_id: '', // Обязательное поле
    title: '',
    description: '',
    content: '',
    video_url: '',
    video_duration: '',
    content_type: 'text',
    tags: '',
    estimated_time: 0,
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
      logger.error('Failed to fetch lessons:', error);
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

  // Уроки всегда привязаны к модулям, поэтому свободных уроков нет
  const freeLessons: Lesson[] = [];

  const handleCreateLesson = async () => {
    // Валидация всех обязательных полей согласно схеме LessonCreate
    if (!lessonFormData.id || !lessonFormData.id.trim()) {
      toast.error('Введите ID урока');
      return;
    }
    if (!lessonFormData.module_id) {
      toast.error('Выберите модуль для урока. Урок должен быть привязан к модулю');
      return;
    }
    if (!lessonFormData.title || !lessonFormData.title.trim()) {
      toast.error('Введите название урока');
      return;
    }
    if (!lessonFormData.description || !lessonFormData.description.trim()) {
      toast.error('Введите описание урока');
      return;
    }
    if (!lessonFormData.content || !lessonFormData.content.trim()) {
      toast.error('Введите контент урока');
      return;
    }

    try {
      // Создаем урок с обязательным module_id и всеми обязательными полями
      const createData = {
        id: lessonFormData.id.trim(),
        module_id: lessonFormData.module_id, // Обязательное поле
        title: lessonFormData.title.trim(),
        description: lessonFormData.description.trim(), // Обязательное поле
        content: lessonFormData.content.trim(), // Обязательное поле
        video_url: lessonFormData.video_url?.trim() || null,
        video_duration: lessonFormData.video_duration?.trim() || null,
        content_type: lessonFormData.content_type || 'text',
        tags: lessonFormData.tags?.trim() || null,
        estimated_time: lessonFormData.estimated_time || 0,
        order_index: 0, // Будет установлен автоматически на бэкенде
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

  const resetLessonForm = () => {
    setLessonFormData({
      id: '',
      module_id: '', // Обязательное поле
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


  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Конструктор контента</h1>
          <p className="text-gray-600 text-sm">Создавайте уроки, объединяйте их в модули, модули в курсы</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/lessons/create')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 px-6 py-2.5 shadow-md cursor-pointer"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Plus size={20} />
            Создать урок
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/modules/new')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-green-600 hover:bg-green-700 px-6 py-2.5 shadow-md cursor-pointer"
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            title="Создать новый модуль"
          >
            <Package size={20} />
            Создать модуль
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/courses/new')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-purple-600 hover:bg-purple-700 px-6 py-2.5 shadow-md cursor-pointer"
            style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
          >
            <BookOpen size={20} />
            Создать курс
          </button>
        </div>
      </div>

      {/* Информация о структуре */}
      <Card className="p-6 bg-white border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Структура: КУРС → МОДУЛИ → УРОКИ</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm">
            Все уроки должны быть привязаны к модулям. Создайте модуль, затем создайте уроки для него.
          </p>
        </div>
      </Card>

      {/* Модули по курсам */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-black">Модули по курсам</h2>
        {FIXED_COURSES.map((course) => {
          const courseModules = modules.filter(m => m.course_id === course.id);
          return (
            <Card key={course.id} className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">{course.title}</h3>
              {courseModules.length === 0 ? (
                <p className="text-gray-600 text-sm">Нет модулей в этом курсе</p>
              ) : (
                <div className="space-y-3">
                  {courseModules.map((module) => {
                    const moduleLessonsList = lessons.filter(l => l.module_id === module.id);
                    return (
                      <Card key={module.id} className="p-4 bg-white border-gray-300">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-black font-semibold">{module.title}</h4>
                            <p className="text-gray-600 text-sm">{module.description || 'Без описания'}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:text-red-600"
                            onClick={async () => {
                              if (confirm('Удалить модуль? Все уроки модуля будут удалены.')) {
                                try {
                                  // Удаляем модуль (уроки удалятся каскадно)
                                  await adminAPI.modules.delete(module.id);
                                  toast.success('Модуль и все его уроки удалены');
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
                          <p className="text-xs text-gray-700 mb-2">Уроки в модуле ({moduleLessonsList.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {moduleLessonsList.map((lesson) => (
                              <span
                                key={lesson.id}
                                className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-300"
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
          className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto !z-[9999]"
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
            <DialogDescription className="text-gray-300">
              Создайте урок. Позже вы сможете объединить уроки в модули.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID урока *</Label>
              <Input
                value={lessonFormData.id}
                onChange={(e) => setLessonFormData({ ...lessonFormData, id: e.target.value })}
                placeholder="lesson-1"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                placeholder="Название урока"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-200">Описание *</Label>
              <Textarea
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
                required
                placeholder="Краткое описание урока (обязательно)"
              />
            </div>
            <div>
              <Label className="text-gray-200">Контент *</Label>
              <Textarea
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                rows={5}
                required
                placeholder="Основной контент урока в формате Markdown (обязательно)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-200">Тип контента</Label>
                <Select
                  modal={false}
                  value={lessonFormData.content_type}
                  onValueChange={(value) => setLessonFormData({ ...lessonFormData, content_type: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!bg-gray-800 border-gray-700 shadow-lg text-white">
                    <SelectItem value="text" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Текст</SelectItem>
                    <SelectItem value="video" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Видео</SelectItem>
                    <SelectItem value="interactive" className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Интерактивный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-200">Время (мин)</Label>
                <Input
                  type="number"
                  value={lessonFormData.estimated_time}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    setLessonFormData({ ...lessonFormData, estimated_time: isNaN(num) ? 0 : num });
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="0"
                />
              </div>
            </div>
            {lessonFormData.content_type === 'video' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">URL видео</Label>
                  <Input
                    value={lessonFormData.video_url}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, video_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-200">Длительность видео</Label>
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
              <Label className="text-gray-200">Модуль *</Label>
              <Select
                modal={false}
                value={lessonFormData.module_id}
                onValueChange={(value) => setLessonFormData({ ...lessonFormData, module_id: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Выберите модуль" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 shadow-lg">
                  {modules.map((module) => (
                    <SelectItem 
                      key={module.id} 
                      value={module.id}
                      className="bg-gray-800 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                    >
                      {module.title} ({FIXED_COURSES.find(c => c.id === module.course_id)?.title || module.course_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modules.length === 0 && (
                <p className="text-yellow-400 text-xs mt-1">Сначала создайте модуль</p>
              )}
            </div>
            <div>
              <Label className="text-gray-200">Теги (через запятую)</Label>
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
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 px-4 py-2 cursor-pointer"
                style={{ borderColor: '#374151', color: '#d1d5db' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateLesson}
                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 px-4 py-2 shadow-md cursor-pointer"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <Plus size={18} />
                Создать урок
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

