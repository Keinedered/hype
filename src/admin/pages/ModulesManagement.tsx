import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { useApiQuery, useApiMutation } from '../hooks';
import { LoadingState, ErrorState, EmptyState, ConfirmDialog, SearchBar, FormField } from '../components';
import { useFormValidation } from '../hooks';
import { generateIdFromTitle } from '../utils';
import { toast } from 'sonner';
import { filterFixedCourses } from '../utils/fixedCourses';

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

export function ModulesManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; moduleId: string | null }>({
    open: false,
    moduleId: null,
  });

  // Загрузка данных из БД через API
  // Все данные берутся напрямую из базы данных через backend endpoints
  const { data: coursesData, loading: coursesLoading } = useApiQuery(
    () => adminAPI.courses.getAll(), // GET /admin/courses - получает курсы из БД
    { cacheTime: 5 * 60 * 1000 }
  );

  const { data: modulesData, loading: modulesLoading, error, refetch } = useApiQuery(
    () => {
      console.log('[ModulesManagement] Calling adminAPI.modules.getAll()');
      return adminAPI.modules.getAll(); // GET /admin/modules - получает модули из БД
    },
    { 
      queryKey: 'modules', // Явный ключ кэша для модулей
      cacheTime: 2 * 60 * 1000,
      enabled: true,
      onSuccess: (data) => {
        console.log('[ModulesManagement] Modules loaded successfully in onSuccess:', data, 'Count:', Array.isArray(data) ? data.length : 'N/A');
      },
      onError: (err) => {
        console.error('[ModulesManagement] Error loading modules:', err);
      }
    }
  );

  // Фильтруем только фиксированные курсы (4 курса)
  // Пустой массив [] - это валидные данные (нет курсов/модулей), а не отсутствие данных
  const courses = useMemo(() => {
    const allCourses = Array.isArray(coursesData) ? coursesData : [];
    console.log('[ModulesManagement] All courses from API:', allCourses);
    const filtered = filterFixedCourses(allCourses);
    console.log('[ModulesManagement] Filtered courses (fixed only):', filtered);
    return filtered;
  }, [coursesData]);
  const modules = useMemo(() => {
    const allModules = Array.isArray(modulesData) ? modulesData : [];
    console.log('[ModulesManagement] All modules from API:', allModules, 'Count:', allModules.length);
    console.log('[ModulesManagement] Modules data type:', typeof modulesData, 'Is array:', Array.isArray(modulesData));
    if (modulesData && !Array.isArray(modulesData)) {
      console.warn('[ModulesManagement] modulesData is not an array!', modulesData);
    }
    return allModules;
  }, [modulesData]);

  // Группировка модулей по курсам
  // На площадке всего 4 фиксированных курса, каждый содержит модули (образуют граф)
  type CourseGroup = { course: Course; modules: Module[] };
  const modulesByCourse = useMemo(() => {
    console.log('[ModulesManagement] Grouping modules by course. Courses:', courses, 'Modules:', modules);
    const grouped: { [courseId: string]: CourseGroup } = {};
    
    // Сначала группируем все модули по их course_id
    const modulesByCourseId: { [courseId: string]: Module[] } = {};
    modules.forEach((module: Module) => {
      if (!module.course_id) {
        console.warn('[ModulesManagement] Module without course_id:', module);
        return;
      }
      if (!modulesByCourseId[module.course_id]) {
        modulesByCourseId[module.course_id] = [];
      }
      modulesByCourseId[module.course_id].push(module);
    });
    
    console.log('[ModulesManagement] Modules grouped by course_id:', modulesByCourseId);
    
    // Группируем модули по всем курсам (на площадке всего 4 курса)
    // Если курсы еще не загрузились, используем course_id из модулей
    if (courses.length > 0) {
      courses.forEach((course: Course) => {
        grouped[course.id] = {
          course,
          modules: modulesByCourseId[course.id] || [],
        };
      });
    } else {
      // Если курсы еще не загрузились, создаем группы на основе course_id из модулей
      Object.keys(modulesByCourseId).forEach((courseId) => {
        // Находим курс по ID или создаем временный объект
        const course = courses.find(c => c.id === courseId) || {
          id: courseId,
          title: courseId, // Временное название
        } as Course;
        grouped[courseId] = {
          course,
          modules: modulesByCourseId[courseId] || [],
        };
      });
    }

    // Сортируем модули по order_index
    Object.values(grouped).forEach((group: CourseGroup) => {
      group.modules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });

    console.log('[ModulesManagement] Final grouped modules by course:', grouped);
    return grouped;
  }, [courses, modules]);

  // Фильтрация модулей для поиска
  const filteredModulesByCourse = useMemo(() => {
    if (!searchQuery) return modulesByCourse;

    const filtered: { [courseId: string]: CourseGroup } = {};
    const query = searchQuery.toLowerCase();

    Object.entries(modulesByCourse).forEach(([courseId, group]: [string, CourseGroup]) => {
      const filteredModules = group.modules.filter((m: Module) =>
        m.title.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query))
      );

      if (filteredModules.length > 0) {
        filtered[courseId] = {
          course: group.course,
          modules: filteredModules,
        };
      }
    });

    return filtered;
  }, [modulesByCourse, searchQuery]);

  // Форма с валидацией
  const formValidation = useFormValidation(
    {
      id: '',
      course_id: '',
      title: '',
      description: '',
      order_index: 1,
      prerequisites: '',
    },
    {
      rules: {
        id: {
          required: true,
          minLength: 3,
          pattern: /^[a-z0-9_-]+$/,
        },
        course_id: {
          required: true,
        },
        title: {
          required: true,
          minLength: 3,
        },
      },
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  const formData = formValidation.data;
  const { setFieldValue, handleBlur, validate, errors, reset: resetForm } = formValidation;

  // Мутации для работы с БД
  // Все операции (создание, обновление, удаление) выполняются напрямую в БД через backend
  const createMutation = useApiMutation(
    (data: any) => adminAPI.modules.create(data), // POST /admin/modules - создает модуль в БД
    {
      invalidateQueries: ['modules', 'courses'], // Инвалидируем модули и курсы (т.к. курсы могут содержать информацию о модулях)
      successMessage: 'Модуль успешно создан',
      onSuccess: () => {
        refetch(); // Перезагружаем данные из БД после создания
      },
    }
  );

  const updateMutation = useApiMutation(
    (data: { id: string; data: any }) => adminAPI.modules.update(data.id, data.data), // PUT /admin/modules/{id} - обновляет модуль в БД
    {
      invalidateQueries: ['modules', 'courses'], // Инвалидируем модули и курсы (т.к. курсы могут содержать информацию о модулях)
      successMessage: 'Модуль успешно обновлен',
      onSuccess: () => {
        refetch(); // Перезагружаем данные из БД после обновления
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => adminAPI.modules.delete(id), // DELETE /admin/modules/{id} - удаляет модуль из БД
    {
      invalidateQueries: ['modules', 'courses'], // Инвалидируем модули и курсы (т.к. курсы могут содержать информацию о модулях)
      successMessage: 'Модуль успешно удален',
      onSuccess: () => {
        refetch(); // Перезагружаем данные из БД после удаления
      },
    }
  );

  // Обработчики
  const handleCreate = async () => {
    if (!validate()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

    const courseGroup = modulesByCourse[formData.course_id];
    const courseModules = courseGroup ? courseGroup.modules : [];
    const indices = courseModules.map((m: Module) => m.order_index || 0);
    const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 1;

    const createData = {
      id: formData.id.trim(),
      course_id: formData.course_id,
      title: formData.title.trim(),
      description: formData.description.trim() || '',
      order_index: formData.order_index || nextIndex,
      prerequisites: formData.prerequisites.trim() || null,
    };

    await createMutation.mutate(createData);
    setIsCreateDialogOpen(false);
    resetForm();
  };


  const handleDelete = async () => {
    if (!deleteConfirm.moduleId) return;
    await deleteMutation.mutate(deleteConfirm.moduleId);
    setDeleteConfirm({ open: false, moduleId: null });
  };

  const openEditDialog = (module: Module) => {
    // Перенаправляем на страницу редактирования модуля
    navigate(`/admin/modules/${module.id}/edit`);
  };

  const handleTitleChange = (value: string) => {
    setFieldValue('title', value);
    if (!formData.id) {
      const generatedId = generateIdFromTitle(value);
      setFieldValue('id', generatedId);
    }
  };

  // Показываем загрузку только если модули еще не загрузились
  // Курсы могут загружаться параллельно, но модули должны отображаться сразу
  const courseGroups: CourseGroup[] = Object.values(filteredModulesByCourse);
  const totalModules = courseGroups.reduce((sum, group) => sum + group.modules.length, 0);

  // Логируем состояние для отладки
  console.log('[ModulesManagement] Render state:', {
    coursesLoading,
    modulesLoading,
    coursesCount: courses.length,
    modulesCount: modules.length,
    courseGroupsCount: courseGroups.length,
    totalModules,
    coursesData: coursesData,
    modulesData: modulesData,
    error
  });

  // Показываем загрузку только если модули еще загружаются
  // Курсы могут загружаться параллельно, модули отобразятся как только загрузятся
  if (modulesLoading) {
    return <LoadingState message="Загрузка модулей..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Ошибка загрузки модулей" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление модулями</h1>
          <p className="text-gray-300 text-sm">
            Управление модулями. На площадке 4 курса, каждый содержит модули (образуют ветвящийся граф), в модулях находятся уроки.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2" size={20} />
              Создать модуль
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-300 max-w-2xl max-h-[90vh] overflow-y-auto text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Создать новый модуль</DialogTitle>
              <DialogDescription className="text-gray-600">
                Заполните форму для создания нового модуля
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <FormField
                type="select"
                label="Курс"
                value={formData.course_id}
                onChange={(value) => setFieldValue('course_id', value)}
                onBlur={() => handleBlur('course_id')}
                error={errors.course_id}
                required
                options={courses.map((c: Course) => ({ value: c.id, label: c.title }))}
              />

              <FormField
                type="input"
                label="ID модуля"
                value={formData.id}
                onChange={(value) => setFieldValue('id', value)}
                onBlur={() => handleBlur('id')}
                error={errors.id}
                required
                hint="Уникальный идентификатор"
              />

              <FormField
                type="input"
                label="Название модуля"
                value={formData.title}
                onChange={handleTitleChange}
                onBlur={() => handleBlur('title')}
                error={errors.title}
                required
              />

              <FormField
                type="textarea"
                label="Описание"
                value={formData.description}
                onChange={(value) => setFieldValue('description', value)}
                rows={3}
                hint="Опционально"
              />

              <FormField
                type="input"
                label="Порядковый номер"
                value={String(formData.order_index || 1)}
                onChange={(value) => {
                  const num = parseInt(value, 10);
                  setFieldValue('order_index', isNaN(num) ? 1 : num);
                }}
                inputType="number"
                hint="Порядок отображения в курсе"
              />

              <FormField
                type="textarea"
                label="Предварительные требования"
                value={formData.prerequisites}
                onChange={(value) => setFieldValue('prerequisites', value)}
                rows={2}
                hint="Опционально"
              />

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createMutation.loading}
                >
                  {createMutation.loading ? 'Создание...' : 'Создать модуль'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Поиск */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Поиск по названию или ID..."
              onSearch={setSearchQuery}
            />
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-300">
          Найдено модулей: {totalModules} из {modules.length}
        </div>
      </Card>

      {/* Модули по курсам (4 курса на площадке, каждый содержит модули) */}
      {courseGroups.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Модули не найдены"
          description={
            searchQuery
              ? 'Попробуйте изменить параметры поиска'
              : 'Создайте первый модуль для курса'
          }
          actionLabel="Создать модуль"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      ) : (
        <div className="space-y-0">
          {courseGroups.map((group, index) => (
            <div key={group.course.id}>
              {index > 0 && <hr className="border-gray-700 my-6" />}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{group.course.title}</h2>
                  <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                    {group.modules.length} {group.modules.length === 1 ? 'модуль' : 'модулей'}
                  </Badge>
                </div>
                
                {group.modules.length === 0 ? (
                  <p className="text-gray-400 text-sm">Нет модулей для этого курса</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.modules.map((module: Module) => (
                      <Card key={module.id} className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                            <p className="text-gray-300 text-sm font-mono mb-2">ID: {module.id}</p>
                            <Badge variant="outline" className="border-gray-600/30 text-gray-400">
                              Порядок: {module.order_index}
                            </Badge>
                          </div>
                        </div>

                        {module.description && (
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{module.description}</p>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-800">
                          <Button
                            onClick={() => openEditDialog(module)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Edit className="mr-1" size={14} />
                            Редактировать
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirm({ open: true, moduleId: module.id })}
                            variant="outline"
                            size="sm"
                            className="border-red-700 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, moduleId: deleteConfirm.moduleId })}
        title="Удалить модуль?"
        description="Это действие нельзя отменить. Все связанные уроки будут отвязаны от модуля."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
