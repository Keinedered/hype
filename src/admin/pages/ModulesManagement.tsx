import { useState, useMemo } from 'react';
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
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; moduleId: string | null }>({
    open: false,
    moduleId: null,
  });

  // Загрузка данных
  const { data: coursesData, loading: coursesLoading } = useApiQuery(
    () => adminAPI.courses.getAll(),
    { cacheTime: 5 * 60 * 1000 }
  );

  const { data: modulesData, loading: modulesLoading, error, refetch } = useApiQuery(
    () => adminAPI.modules.getAll(selectedCourseId || undefined),
    { 
      cacheTime: 2 * 60 * 1000,
      enabled: true, // Загружаем всегда, даже если курс не выбран
    }
  );

  const courses = Array.isArray(coursesData) ? coursesData : [];
  const modules = Array.isArray(modulesData) ? modulesData : [];

  // Фильтрация модулей
  const filteredModules = useMemo(() => {
    let filtered = modules;
    
    if (selectedCourseId) {
      filtered = filtered.filter((m: Module) => m.course_id === selectedCourseId);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((m: Module) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Сортируем по order_index
    return filtered.sort((a: Module, b: Module) => (a.order_index || 0) - (b.order_index || 0));
  }, [modules, selectedCourseId, searchQuery]);

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

  // Мутации
  const createMutation = useApiMutation(
    (data: any) => adminAPI.modules.create(data),
    {
      invalidateQueries: ['modules'],
      successMessage: 'Модуль успешно создан',
      onSuccess: () => {
        refetch();
      },
    }
  );

  const updateMutation = useApiMutation(
    (data: { id: string; data: any }) => adminAPI.modules.update(data.id, data.data),
    {
      invalidateQueries: ['modules'],
      successMessage: 'Модуль успешно обновлен',
      onSuccess: () => {
        refetch();
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => adminAPI.modules.delete(id),
    {
      invalidateQueries: ['modules'],
      successMessage: 'Модуль успешно удален',
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Обработчики
  const handleCreate = async () => {
    if (!validate()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

    const indices = filteredModules.length > 0
      ? filteredModules.map((m: Module) => m.order_index || 0)
      : [];
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

  const handleUpdate = async () => {
    if (!editingModule) return;
    if (!validate()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

    const updateData = {
      title: formData.title.trim(),
      description: formData.description.trim() || '',
      order_index: formData.order_index || 0,
      prerequisites: formData.prerequisites.trim() || null,
    };

    await updateMutation.mutate({ id: editingModule.id, data: updateData });
    setIsEditDialogOpen(false);
    setEditingModule(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteConfirm.moduleId) return;
    await deleteMutation.mutate(deleteConfirm.moduleId);
    setDeleteConfirm({ open: false, moduleId: null });
  };

  const openEditDialog = (module: Module) => {
    setEditingModule(module);
    resetForm({
      id: module.id,
      course_id: module.course_id,
      title: module.title,
      description: module.description || '',
      order_index: module.order_index || 0,
      prerequisites: module.prerequisites || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setFieldValue('title', value);
    if (!editingModule && !formData.id) {
      const generatedId = generateIdFromTitle(value);
      setFieldValue('id', generatedId);
    }
  };

  const loading = coursesLoading || modulesLoading;

  if (loading) {
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
            Создание и редактирование модулей курсов
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
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый модуль</DialogTitle>
              <DialogDescription className="text-gray-300">
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
                  className="flex-1 border-gray-700"
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

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Поиск по названию или ID..."
              onSearch={setSearchQuery}
            />
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
          >
            <option value="">Все курсы</option>
            {courses.map((course: Course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 text-sm text-gray-300">
          Найдено модулей: {filteredModules.length} из {modules.length}
        </div>
      </Card>

      {/* Список модулей */}
      {filteredModules.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Модули не найдены"
          description={
            searchQuery || selectedCourseId
              ? 'Попробуйте изменить параметры поиска или фильтры'
              : 'Создайте первый модуль для курса'
          }
          actionLabel="Создать модуль"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module: Module) => {
            const course = courses.find((c: Course) => c.id === module.course_id);
            return (
              <Card key={module.id} className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                    <p className="text-gray-300 text-sm font-mono mb-2">ID: {module.id}</p>
                    {course && (
                      <Badge variant="outline" className="border-blue-600/30 text-blue-400 mb-2">
                        {course.title}
                      </Badge>
                    )}
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
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingModule(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать модуль</DialogTitle>
            <DialogDescription className="text-gray-300">
              Измените данные модуля. ID и курс нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <FormField
              type="input"
              label="ID модуля"
              value={formData.id}
              onChange={() => {}}
              hint="ID нельзя изменить"
            />

            <FormField
              type="input"
              label="Название модуля"
              value={formData.title}
              onChange={(value) => setFieldValue('title', value)}
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
            />

            <FormField
              type="input"
              label="Порядковый номер"
              value={String(formData.order_index || 0)}
              onChange={(value) => {
                const num = parseInt(value, 10);
                setFieldValue('order_index', isNaN(num) ? 0 : num);
              }}
              inputType="number"
            />

            <FormField
              type="textarea"
              label="Предварительные требования"
              value={formData.prerequisites}
              onChange={(value) => setFieldValue('prerequisites', value)}
              rows={2}
            />

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setIsEditDialogOpen(false)}
                variant="outline"
                className="flex-1 border-gray-700"
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={updateMutation.loading}
              >
                {updateMutation.loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
