import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  ChevronUp,
  ChevronDown,
  GripVertical,
  FileText,
  Clock,
  Network,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';
import { filterFixedCourses } from '../utils/fixedCourses';
import { useApiQuery, useApiMutation } from '../hooks';
import { LoadingState, ErrorState, ConfirmDialog } from '../components';

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  prerequisites?: string;
}

interface Lesson {
  id: string;
  module_id: string | null;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  video_duration?: string;
  content_type: string;
  order_index: number;
  estimated_time: number;
  tags?: string;
}

interface Course {
  id: string;
  title: string;
  track_id: string;
}

export function ModuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    id: '',
    course_id: '',
    title: '',
    description: '',
    order_index: 0,
    prerequisites: '',
  });

  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<{ open: boolean; lessonId: string | null }>({
    open: false,
    lessonId: null,
  });

  // Загрузка данных
  const { data: coursesData, loading: coursesLoading } = useApiQuery(
    () => adminAPI.courses.getAll(),
    { cacheTime: 5 * 60 * 1000 }
  );

  const { data: moduleData, loading: moduleLoading, error: moduleError, refetch: refetchModule } = useApiQuery(
    () => adminAPI.modules.getById(id!),
    { 
      enabled: !!id && isEditMode,
      cacheTime: 2 * 60 * 1000,
    }
  );

  const { data: lessonsData, loading: lessonsLoading, refetch: refetchLessons } = useApiQuery(
    () => adminAPI.lessons.getAll(),
    { cacheTime: 2 * 60 * 1000 }
  );

  const { data: modulesData } = useApiQuery(
    () => adminAPI.modules.getAll(),
    { cacheTime: 2 * 60 * 1000 }
  );

  // Фильтруем только фиксированные курсы
  const courses = filterFixedCourses(Array.isArray(coursesData) ? coursesData : []);
  const allLessons = Array.isArray(lessonsData) ? lessonsData : [];
  const allModules = Array.isArray(modulesData) ? modulesData : [];

  // Уроки текущего модуля, отсортированные по order_index
  const moduleLessons = useMemo(() => {
    if (!id) return [];
    return allLessons
      .filter((lesson: Lesson) => lesson.module_id === id)
      .sort((a: Lesson, b: Lesson) => (a.order_index || 0) - (b.order_index || 0));
  }, [allLessons, id]);

  // Статистика модуля
  const moduleStats = useMemo(() => {
    return {
      totalLessons: moduleLessons.length,
      totalTime: moduleLessons.reduce((sum: number, lesson: Lesson) => sum + (lesson.estimated_time || 0), 0),
      textLessons: moduleLessons.filter((l: Lesson) => l.content_type === 'text').length,
      videoLessons: moduleLessons.filter((l: Lesson) => l.content_type === 'video').length,
    };
  }, [moduleLessons]);

  // Загружаем данные модуля
  useEffect(() => {
    if (isEditMode && moduleData) {
      const module = moduleData as Module;
      setFormData({
        id: module.id,
        course_id: module.course_id,
        title: module.title,
        description: module.description || '',
        order_index: module.order_index || 0,
        prerequisites: module.prerequisites || '',
      });
    }
  }, [moduleData, isEditMode]);

  // Мутации
  const saveModuleMutation = useApiMutation(
    (data: any) => isEditMode 
      ? adminAPI.modules.update(id!, data)
      : adminAPI.modules.create(data),
    {
      invalidateQueries: ['modules', 'courses'], // Инвалидируем модули и курсы
      successMessage: isEditMode ? 'Модуль успешно обновлен' : 'Модуль успешно создан',
      onSuccess: () => {
        refetchModule();
        if (!isEditMode) {
          navigate('/admin/modules');
        }
      },
    }
  );

  const deleteLessonMutation = useApiMutation(
    (lessonId: string) => adminAPI.lessons.delete(lessonId),
    {
      invalidateQueries: ['lessons', 'modules'], // Инвалидируем уроки и модули
      successMessage: 'Урок успешно удален',
      onSuccess: () => {
        refetchLessons();
      },
    }
  );

  const updateLessonOrderMutation = useApiMutation(
    async (updates: Array<{ id: string; order_index: number }>) => {
      await Promise.all(
        updates.map(({ id, order_index }) => 
          adminAPI.lessons.update(id, { order_index })
        )
      );
    },
    {
      invalidateQueries: ['lessons', 'modules'], // Инвалидируем уроки и модули
      successMessage: 'Порядок уроков обновлен',
      onSuccess: () => {
        refetchLessons();
      },
    }
  );

  // Обработчики
  const handleSave = async () => {
    if (!formData.title || !formData.course_id) {
      toast.error('Заполните обязательные поля: название и курс');
      return;
    }

    await saveModuleMutation.mutate({
      course_id: formData.course_id,
      title: formData.title,
      description: formData.description,
      order_index: formData.order_index || 0,
      prerequisites: formData.prerequisites || null,
    });
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonConfirm.lessonId) return;
    await deleteLessonMutation.mutate(deleteLessonConfirm.lessonId);
    setDeleteLessonConfirm({ open: false, lessonId: null });
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = moduleLessons.findIndex((l: Lesson) => l.id === lessonId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= moduleLessons.length) return;

    const updates = [
      { id: lessonId, order_index: newIndex },
      { id: moduleLessons[newIndex].id, order_index: currentIndex },
    ];

    await updateLessonOrderMutation.mutate(updates);
  };

  const handleCreateLesson = () => {
    // Перенаправляем на создание урока с предзаполненным module_id
    navigate(`/admin/lessons/create?module_id=${id}`);
  };

  const handleEditLesson = (lesson: Lesson) => {
    // Перенаправляем на редактирование урока с параметром для возврата на модуль
    navigate(`/admin/lessons/${lesson.id}/edit?module_id=${id}`);
  };

  const loading = coursesLoading || (isEditMode && moduleLoading) || lessonsLoading;

  // Показываем загрузку только если идет загрузка
  // Пустой массив - это валидные данные
  if (loading) {
    return <LoadingState message="Загрузка данных модуля..." />;
  }

  if (isEditMode && moduleError) {
    return (
      <ErrorState 
        error={moduleError} 
        title="Ошибка загрузки модуля" 
        onRetry={refetchModule}
      />
    );
  }

  const currentCourse = courses.find((c: Course) => c.id === formData.course_id);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/modules')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Редактирование модуля' : 'Создание модуля'}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {isEditMode 
                    ? `Модуль: ${formData.title || 'Загрузка...'}`
                    : 'Заполните форму для создания нового модуля'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/modules')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveModuleMutation.loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="mr-2" size={18} />
                {saveModuleMutation.loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Основная информация - левая колонка (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основная информация о модуле */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Основная информация</h2>
                {isEditMode && currentCourse && (
                  <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                    {currentCourse.title}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">ID модуля *</Label>
                    <Input
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="module-1"
                      required
                      disabled={isEditMode}
                    />
                    {isEditMode && (
                      <p className="text-xs text-gray-500 mt-1">ID нельзя изменить</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Курс *</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-black">
                        <SelectValue placeholder="Выберите курс" />
                      </SelectTrigger>
                      <SelectContent className="!bg-gray-800 border-gray-700 text-white">
                        {courses.map((course: Course) => (
                          <SelectItem 
                            key={course.id} 
                            value={course.id}
                            className="text-white hover:bg-gray-700"
                          >
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Название модуля *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Введите название модуля"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                    placeholder="Описание модуля..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Порядковый номер</Label>
                    <Input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => {
                        const num = parseInt(e.target.value, 10);
                        setFormData(prev => ({ ...prev, order_index: isNaN(num) ? 0 : num }));
                      }}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Предварительные требования</Label>
                    <Input
                      value={formData.prerequisites}
                      onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="ID модулей через запятую"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Уроки модуля */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Уроки модуля</h2>
                  <p className="text-sm text-gray-400">
                    {moduleLessons.length === 0 
                      ? 'В модуле пока нет уроков'
                      : `${moduleLessons.length} ${moduleLessons.length === 1 ? 'урок' : moduleLessons.length < 5 ? 'урока' : 'уроков'}`
                    }
                  </p>
                </div>
                {isEditMode && (
                  <Button
                    onClick={handleCreateLesson}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="mr-2" size={18} />
                    Добавить урок
                  </Button>
                )}
              </div>

              {moduleLessons.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                  <FileText className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400 mb-2">В модуле пока нет уроков</p>
                  {isEditMode && (
                    <Button
                      onClick={handleCreateLesson}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="mr-2" size={16} />
                      Создать первый урок
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {moduleLessons.map((lesson: Lesson, index: number) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Порядок и управление */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical className="text-gray-500" size={18} />
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                              onClick={() => handleMoveLesson(lesson.id, 'up')}
                              disabled={index === 0 || updateLessonOrderMutation.loading}
                            >
                              <ChevronUp size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                              onClick={() => handleMoveLesson(lesson.id, 'down')}
                              disabled={index === moduleLessons.length - 1 || updateLessonOrderMutation.loading}
                            >
                              <ChevronDown size={14} />
                            </Button>
                          </div>
                        </div>

                        {/* Информация об уроке */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white">{lesson.title}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    lesson.content_type === 'video'
                                      ? 'border-blue-600/30 text-blue-400'
                                      : 'border-gray-600/30 text-gray-400'
                                  }
                                >
                                  {lesson.content_type === 'video' ? 'Видео' : 'Текст'}
                                </Badge>
                              </div>
                              {lesson.description && (
                                <p className="text-sm text-gray-400 line-clamp-2">{lesson.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                            {lesson.estimated_time > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{lesson.estimated_time} мин</span>
                              </div>
                            )}
                            {lesson.video_duration && (
                              <div className="flex items-center gap-1">
                                <FileText size={14} />
                                <span>{lesson.video_duration}</span>
                              </div>
                            )}
                            {lesson.tags && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-600">Теги: {lesson.tags}</span>
                              </div>
                            )}
                            <span className="text-gray-600">#{lesson.order_index || index + 1}</span>
                          </div>
                        </div>

                        {/* Действия */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLesson(lesson)}
                            className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 border border-gray-700"
                            title="Редактировать урок"
                          >
                            <Edit size={14} className="mr-1" />
                            Редактировать
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteLessonConfirm({ open: true, lessonId: lesson.id })}
                            className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            title="Удалить урок"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Боковая панель - правая колонка (1/3) */}
          <div className="space-y-6">
            {/* Статистика */}
            {isEditMode && (
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Статистика модуля</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Всего уроков</span>
                    <span className="text-white font-semibold">{moduleStats.totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Общее время</span>
                    <span className="text-white font-semibold">
                      {moduleStats.totalTime > 0 ? `${moduleStats.totalTime} мин` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Текстовые уроки</span>
                    <span className="text-white font-semibold">{moduleStats.textLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Видео уроки</span>
                    <span className="text-white font-semibold">{moduleStats.videoLessons}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Информация о курсе */}
            {currentCourse && (
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Информация о курсе</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Название</span>
                    <p className="text-white font-medium">{currentCourse.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">ID курса</span>
                    <p className="text-white font-mono text-sm">{currentCourse.id}</p>
                  </div>
                  <Link
                    to={`/admin/courses/${currentCourse.id}/edit`}
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm mt-3"
                  >
                    <Eye className="mr-1" size={14} />
                    Открыть курс
                  </Link>
                </div>
              </Card>
            )}

            {/* Быстрые действия */}
            {isEditMode && (
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Быстрые действия</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => navigate('/admin/graph')}
                  >
                    <Network className="mr-2" size={16} />
                    Редактировать граф
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={handleCreateLesson}
                  >
                    <Plus className="mr-2" size={16} />
                    Добавить урок
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Диалог подтверждения удаления урока */}
      <ConfirmDialog
        open={deleteLessonConfirm.open}
        onOpenChange={(open) => setDeleteLessonConfirm({ open, lessonId: deleteLessonConfirm.lessonId })}
        title="Удалить урок?"
        description="Это действие нельзя отменить. Урок будет удален из модуля и базы данных."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={handleDeleteLesson}
      />
    </div>
  );
}
