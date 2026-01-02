import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Globe, Eye } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation, invalidateCache } from '../hooks';
import { LoadingState, ErrorState, EmptyState, ConfirmDialog, SearchBar, FormField } from '../components';
import { useFormValidation } from '../hooks';
import { generateIdFromTitle } from '../utils';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  level: string;
  track_id: string;
  status: string;
  authors?: string[];
  created_at?: string;
}

const FIXED_COURSES = [
  { id: 'design', title: 'Дизайн', track: 'design' },
  { id: 'event-basics', title: 'Ивент', track: 'event' },
  { id: 'product-intro', title: 'Цифровые продукты', track: 'digital' },
  { id: 'business-comm', title: 'Внешние коммуникации', track: 'communication' },
];

export function CoursesManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; courseId: string | null }>({
    open: false,
    courseId: null,
  });

  // Загрузка курсов
  const { data: coursesData, loading, error, refetch } = useApiQuery(
    () => adminAPI.courses.getAll(),
    { cacheTime: 2 * 60 * 1000 }
  );

  const courses = Array.isArray(coursesData) ? coursesData : [];

  // Фильтрация и поиск
  const filteredCourses = useMemo(() => {
    return courses.filter((course: Course) => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesTrack = trackFilter === 'all' || course.track_id === trackFilter;

      return matchesSearch && matchesStatus && matchesTrack;
    });
  }, [courses, searchQuery, statusFilter, trackFilter]);

  // Форма с валидацией
  const formValidation = useFormValidation(
    {
      id: '',
      title: '',
      description: '',
      short_description: '',
      level: 'beginner',
      track_id: 'digital',
      version: '1.0',
      enrollment_deadline: '',
      authors: [] as string[],
    },
    {
      rules: {
        id: {
          required: true,
          minLength: 3,
          pattern: /^[a-z0-9_-]+$/,
        },
        title: {
          required: true,
          minLength: 3,
          maxLength: 200,
        },
        description: {
          required: true,
          minLength: 10,
        },
        short_description: {
          required: true,
          minLength: 5,
          maxLength: 500,
        },
      },
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  const formData = formValidation.data;
  const { setFieldValue, handleBlur, validate, errors, reset: resetForm } = formValidation;

  const [authorInput, setAuthorInput] = useState('');

  // Мутации
  const createMutation = useApiMutation(
    (data: any) => adminAPI.courses.create(data),
    {
      invalidateQueries: ['courses'],
      successMessage: 'Курс успешно создан',
      onSuccess: () => {
        // Перезагружаем данные после успешного создания
        refetch();
      },
    }
  );


  const deleteMutation = useApiMutation(
    (id: string) => adminAPI.courses.delete(id),
    {
      invalidateQueries: ['courses'],
      successMessage: 'Курс успешно удален',
      onSuccess: () => {
        // Перезагружаем данные после успешного удаления
        refetch();
      },
    }
  );

  const publishMutation = useApiMutation(
    (id: string) => adminAPI.courses.publish(id),
    {
      invalidateQueries: ['courses'],
      successMessage: 'Курс успешно опубликован',
      onSuccess: () => {
        // Перезагружаем данные после успешной публикации
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

    const createData = {
      id: formData.id.trim(),
      track_id: formData.track_id,
      title: formData.title.trim(),
      version: formData.version || '1.0',
      description: formData.description.trim(),
      short_description: formData.short_description.trim(),
      level: formData.level,
      enrollment_deadline: formData.enrollment_deadline || null,
      authors: formData.authors,
    };

    await createMutation.mutate(createData);
    setIsCreateDialogOpen(false);
    resetForm();
  };


  const handleDelete = async () => {
    if (!deleteConfirm.courseId) return;
    await deleteMutation.mutate(deleteConfirm.courseId);
    setDeleteConfirm({ open: false, courseId: null });
  };

  const handlePublish = async (id: string) => {
    await publishMutation.mutate(id);
  };


  const addAuthor = () => {
    if (authorInput.trim() && Array.isArray(formData.authors) && !formData.authors.includes(authorInput.trim())) {
      setFieldValue('authors', [...formData.authors, authorInput.trim()]);
      setAuthorInput('');
    }
  };

  const removeAuthor = (index: number) => {
    if (Array.isArray(formData.authors)) {
      setFieldValue('authors', formData.authors.filter((_, i) => i !== index));
    }
  };

  // Генерация ID из названия
  const handleTitleChange = (value: string) => {
    setFieldValue('title', value);
    if (!formData.id) {
      const generatedId = generateIdFromTitle(value);
      setFieldValue('id', generatedId);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка курсов..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Ошибка загрузки курсов" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление курсами</h1>
          <p className="text-gray-300 text-sm">
            Создание и управление курсами платформы. Доступно 4 фиксированных курса для редактирования.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2" size={20} />
              Создать курс
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый курс</DialogTitle>
              <DialogDescription className="text-gray-300">
                Заполните форму для создания нового курса. Все поля, отмеченные *, обязательны.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <FormField
                type="input"
                label="ID курса"
                value={formData.id}
                onChange={(value) => setFieldValue('id', value)}
                onBlur={() => handleBlur('id')}
                error={errors.id}
                required
                hint="Уникальный идентификатор (латиница, дефисы, подчеркивания)"
              />

              <FormField
                type="input"
                label="Название курса"
                value={formData.title}
                onChange={handleTitleChange}
                onBlur={() => handleBlur('title')}
                error={errors.title}
                required
                placeholder="Например: React Basics"
              />

              <FormField
                type="textarea"
                label="Краткое описание"
                value={formData.short_description}
                onChange={(value) => setFieldValue('short_description', value)}
                onBlur={() => handleBlur('short_description')}
                error={errors.short_description}
                required
                rows={2}
                hint="Отображается в каталоге курсов"
              />

              <FormField
                type="textarea"
                label="Полное описание"
                value={formData.description}
                onChange={(value) => setFieldValue('description', value)}
                onBlur={() => handleBlur('description')}
                error={errors.description}
                required
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  type="select"
                  label="Уровень"
                  value={formData.level}
                  onChange={(value) => setFieldValue('level', value)}
                  options={[
                    { value: 'beginner', label: 'Начальный' },
                    { value: 'intermediate', label: 'Средний' },
                    { value: 'advanced', label: 'Продвинутый' },
                  ]}
                  required
                />

                <FormField
                  type="select"
                  label="Трек"
                  value={formData.track_id}
                  onChange={(value) => setFieldValue('track_id', value)}
                  options={[
                    { value: 'design', label: 'Дизайн' },
                    { value: 'event', label: 'Ивент' },
                    { value: 'digital', label: 'Цифровые продукты' },
                    { value: 'communication', label: 'Внешние коммуникации' },
                  ]}
                  required
                />
              </div>

              <FormField
                type="input"
                label="Версия"
                value={formData.version}
                onChange={(value) => setFieldValue('version', value)}
                hint="По умолчанию: 1.0"
              />

              <FormField
                type="input"
                label="Срок записи"
                value={formData.enrollment_deadline}
                onChange={(value) => setFieldValue('enrollment_deadline', value)}
                inputType="date"
                hint="Опционально"
              />

              {/* Авторы */}
              <div className="space-y-2">
                <label className="text-gray-200 text-sm font-medium">Авторы курса</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAuthor();
                      }
                    }}
                    placeholder="Введите имя автора"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md placeholder:text-gray-400"
                  />
                  <Button type="button" onClick={addAuthor} variant="outline" className="border-gray-700">
                    Добавить
                  </Button>
                </div>
                {Array.isArray(formData.authors) && formData.authors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.authors.map((author, index) => (
                      <Badge key={index} variant="outline" className="border-blue-600/30 text-blue-400">
                        {author}
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="ml-2 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

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
                  {createMutation.loading ? 'Создание...' : 'Создать курс'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры и поиск */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Поиск по названию, ID или описанию..."
              onSearch={setSearchQuery}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
              <option value="archived">Архив</option>
            </select>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
            >
              <option value="all">Все треки</option>
              <option value="design">Дизайн</option>
              <option value="event">Ивент</option>
              <option value="digital">Цифровые продукты</option>
              <option value="communication">Внешние коммуникации</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-300">
          Найдено курсов: {filteredCourses.length} из {courses.length}
        </div>
      </Card>

      {/* Список курсов */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Курсы не найдены"
          description={searchQuery || statusFilter !== 'all' || trackFilter !== 'all'
            ? 'Попробуйте изменить параметры поиска или фильтры'
            : 'Создайте первый курс, чтобы начать работу'}
          actionLabel="Создать курс"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: Course) => (
            <Card key={course.id} className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{course.title}</h3>
                  <p className="text-gray-300 text-sm font-mono mb-2">ID: {course.id}</p>
                  <div className="flex gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={
                        course.status === 'published'
                          ? 'border-green-600/30 text-green-400'
                          : course.status === 'archived'
                          ? 'border-gray-600/30 text-gray-400'
                          : 'border-yellow-600/30 text-yellow-400'
                      }
                    >
                      {course.status === 'published' ? 'Опубликован' : course.status === 'archived' ? 'Архив' : 'Черновик'}
                    </Badge>
                    <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                      {course.level}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {course.short_description || course.description}
              </p>

              {course.authors && course.authors.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-1">Авторы:</p>
                  <div className="flex flex-wrap gap-1">
                    {course.authors.map((author, idx) => (
                      <Badge key={idx} variant="outline" className="border-gray-600/30 text-gray-400 text-xs">
                        {author}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                {course.status !== 'published' && (
                  <Button
                    onClick={() => handlePublish(course.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-700 text-green-400 hover:bg-green-900/20"
                    disabled={publishMutation.loading}
                  >
                    <Globe className="mr-1" size={14} />
                    Опубликовать
                  </Button>
                )}
                <Button
                  onClick={() => setDeleteConfirm({ open: true, courseId: course.id })}
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

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, courseId: deleteConfirm.courseId })}
        title="Удалить курс?"
        description="Это действие нельзя отменить. Все связанные модули и уроки также будут удалены."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
