import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Globe, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface ModuleFormData {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  prerequisites: string;
}

interface Course {
  id: string;
  title: string;
  track_id: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  module_id: string | null;
}

export function ModuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ModuleFormData>({
    id: '',
    course_id: '',
    title: '',
    description: '',
    order_index: 0,
    prerequisites: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchLessons();
    if (isEditMode && id) {
      loadModule(id);
    } else {
      setFormData(prev => ({
        ...prev,
        id: `module-${Date.now()}`,
      }));
    }
  }, [id, isEditMode]);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.courses.getAll();
      const coursesList = Array.isArray(data) ? data : [];
      setCourses(coursesList);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    }
  };

  const fetchLessons = async () => {
    try {
      const data = await adminAPI.lessons.getAll();
      const lessonsList = Array.isArray(data) ? data : [];
      setLessons(lessonsList);
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error);
      setLessons([]);
    }
  };

  const loadModule = async (moduleId: string) => {
    try {
      setLoading(true);
      const module = await adminAPI.modules.getById(moduleId);
      setFormData({
        id: module.id,
        course_id: module.course_id,
        title: module.title,
        description: module.description || '',
        order_index: module.order_index || 0,
        prerequisites: module.prerequisites || '',
      });
      
      // Загружаем уроки модуля (после загрузки всех уроков)
      const allLessons = await adminAPI.lessons.getAll();
      const lessonsList = Array.isArray(allLessons) ? allLessons : [];
      const moduleLessons = lessonsList.filter((l: Lesson) => l.module_id === moduleId);
      setSelectedLessonIds(moduleLessons.map((l: Lesson) => l.id));
    } catch (error: any) {
      toast.error(`Ошибка загрузки модуля: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.title || !formData.course_id) {
      toast.error('Заполните обязательные поля: ID, название и курс');
      return;
    }

    if (!isEditMode && selectedLessonIds.length === 0) {
      toast.error('Выберите хотя бы один урок для модуля');
      return;
    }

    try {
      setLoading(true);
      
      // Создаем или обновляем модуль
      let moduleId: string;
      if (isEditMode) {
        await adminAPI.modules.update(formData.id, formData);
        moduleId = formData.id;
        
        // Обновляем привязку уроков
        // Сначала получаем текущие уроки модуля
        const currentModuleLessons = lessons.filter(l => l.module_id === moduleId);
        const currentLessonIds = currentModuleLessons.map(l => l.id);
        
        // Удаляем привязку у уроков, которые больше не в модуле
        for (const lessonId of currentLessonIds) {
          if (!selectedLessonIds.includes(lessonId)) {
            await adminAPI.lessons.update(lessonId, { module_id: null });
          }
        }
        
        // Добавляем привязку к новым урокам
        for (const lessonId of selectedLessonIds) {
          if (!currentLessonIds.includes(lessonId)) {
            await adminAPI.lessons.update(lessonId, { module_id: moduleId });
          }
        }
      } else {
        // Создаем модуль с автоматическим созданием узла графа
        const createdModule = await adminAPI.modules.create(formData, {
          createGraphNode: true,
          x: 0,
          y: 0,
        });
        moduleId = createdModule?.id || formData.id;
        
        // Привязываем уроки к модулю
        for (const lessonId of selectedLessonIds) {
          await adminAPI.lessons.update(lessonId, { module_id: moduleId });
        }
      }
      
      toast.success('Модуль успешно сохранен!');
      navigate('/admin/lessons');
    } catch (error: any) {
      toast.error(`Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/modules')}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {isEditMode ? 'Редактировать модуль' : 'Создать модуль'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Заполните форму и сохраните модуль
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSaveAndPublish} className="space-y-6">
          {/* Основная информация */}
          <Card className="bg-white border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-black font-semibold">ID модуля *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="module-1"
                  required
                  disabled={isEditMode}
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Курс *</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                  required
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black placeholder:text-gray-500 mt-2">
                    <SelectValue placeholder="Выберите курс" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-black shadow-lg">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-black font-semibold">Название модуля *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Введите название модуля"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-black font-semibold">Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Описание модуля"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Порядок</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Предварительные требования</Label>
                <Input
                  value={formData.prerequisites}
                  onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="ID модулей через запятую"
                />
              </div>
            </div>
          </Card>

          {/* Выбор уроков */}
          <Card className="bg-white border-gray-200 p-6">
            <Label className="text-black font-semibold text-lg mb-4 block">
              {isEditMode ? 'Уроки в модуле' : 'Выберите уроки для модуля *'}
            </Label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
              {isEditMode ? (
                // В режиме редактирования показываем все уроки (свободные + текущие модуля)
                lessons.filter(l => !l.module_id || l.module_id === formData.id).length === 0 ? (
                  <p className="text-gray-600 text-sm">Нет доступных уроков.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.filter(l => !l.module_id || l.module_id === formData.id).map((lesson) => (
                      <label
                        key={lesson.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-3 rounded border border-gray-200"
                      >
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
                          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600"
                        />
                        <div className="flex-1">
                          <span className="text-black font-medium">{lesson.title}</span>
                          {lesson.description && (
                            <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )
              ) : (
                // В режиме создания показываем только свободные уроки
                lessons.filter(l => !l.module_id).length === 0 ? (
                  <p className="text-gray-600 text-sm">Нет свободных уроков. Создайте уроки сначала.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.filter(l => !l.module_id).map((lesson) => (
                      <label
                        key={lesson.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-3 rounded border border-gray-200"
                      >
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
                          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600"
                        />
                        <div className="flex-1">
                          <span className="text-black font-medium">{lesson.title}</span>
                          {lesson.description && (
                            <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>

          {/* Кнопка сохранения */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-300 p-6 -mx-6 shadow-2xl z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/modules')}
                className="bg-white border-gray-300 text-black hover:bg-gray-50 px-6"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen size={20} className="mr-2" />
                {loading ? 'Сохранение...' : 'Сохранить модуль'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

