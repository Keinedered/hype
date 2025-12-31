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
import { Plus, Edit, Trash2, Eye, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  level: string;
  track_id: string;
  status: string;
  authors?: string[];
}

export function CoursesManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    short_description: '',
    level: 'beginner',
    track_id: 'digital',
    version: '1.0',
    enrollment_deadline: '',
    authors: [] as string[],
  });
  const [authorInput, setAuthorInput] = useState('');
  const [graphOptions, setGraphOptions] = useState({
    createGraphNode: true,
    x: 500,
    y: 300,
  });

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.courses.getAll();
      const coursesList = Array.isArray(data) ? data : [];
      // Сортируем по дате создания (новые первыми)
      coursesList.sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      setCourses(coursesList);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast.error(error.message || 'Ошибка загрузки курсов');
      setCourses([]);
    }
  };

  const handleCreate = async () => {
    // Валидация обязательных полей
    if (!formData.id || !formData.id.trim()) {
      toast.error('Введите ID курса');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название курса');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      toast.error('Введите описание курса');
      return;
    }
    if (!formData.short_description || !formData.short_description.trim()) {
      toast.error('Введите краткое описание курса');
      return;
    }

    try {
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

      await adminAPI.courses.create(createData, {
        createGraphNode: graphOptions.createGraphNode,
        x: graphOptions.x,
        y: graphOptions.y,
      });
      toast.success('Курс успешно создан');
      fetchCourses();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании курса');
    }
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;

    // Валидация
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название курса');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      toast.error('Введите описание курса');
      return;
    }
    if (!formData.short_description || !formData.short_description.trim()) {
      toast.error('Введите краткое описание курса');
      return;
    }

    try {
      // Подготавливаем данные для обновления (исключаем id, так как он не обновляется)
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        level: formData.level,
        track_id: formData.track_id,
        version: formData.version || '1.0',
        enrollment_deadline: formData.enrollment_deadline || null,
        authors: formData.authors,
      };
      
      await adminAPI.courses.update(editingCourse.id, updateData);
      toast.success('Курс успешно обновлен');
      fetchCourses();
      setEditingCourse(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении курса');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить курс?')) return;

    try {
      await adminAPI.courses.delete(id);
      toast.success('Курс успешно удален');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении курса');
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Опубликовать курс? Курс станет доступен для студентов.')) return;

    try {
      await adminAPI.courses.publish(id);
      toast.success('Курс успешно опубликован');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при публикации курса');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      short_description: '',
      level: 'beginner',
      track_id: 'digital',
      version: '1.0',
      enrollment_deadline: '',
      authors: [],
    });
    setAuthorInput('');
    setGraphOptions({
      createGraphNode: true,
      x: 500,
      y: 300,
    });
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    // Преобразуем дату для input type="date" (формат YYYY-MM-DD)
    let enrollmentDate = '';
    if ((course as any).enrollment_deadline) {
      const dateStr = (course as any).enrollment_deadline;
      if (dateStr.includes('T')) {
        enrollmentDate = dateStr.split('T')[0];
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        enrollmentDate = dateStr;
      }
    }
    
    setFormData({
      id: course.id,
      title: course.title,
      description: course.description || '',
      short_description: course.short_description || '',
      level: course.level,
      track_id: course.track_id,
      version: (course as any).version || '1.0',
      enrollment_deadline: enrollmentDate,
      authors: (course as any).authors || [],
    });
    setAuthorInput('');
    setIsEditDialogOpen(true);
  };

  const addAuthor = () => {
    if (authorInput.trim() && !formData.authors.includes(authorInput.trim())) {
      setFormData({
        ...formData,
        authors: [...formData.authors, authorInput.trim()],
      });
      setAuthorInput('');
    }
  };

  const removeAuthor = (index: number) => {
    setFormData({
      ...formData,
      authors: formData.authors.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление курсами</h1>
          <p className="text-gray-400 text-sm">Создание и управление курсами платформы</p>
        </div>
        <div className="text-gray-400 text-sm">
          Доступно 4 фиксированных курса для редактирования
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-auto"
              onClick={() => resetForm()}
            >
              <Plus className="mr-2" size={20} />
              Добавить новый курс (старый способ)
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать новый курс</DialogTitle>
              <DialogDescription className="text-gray-400">
                Заполните форму для создания нового курса. Все поля, отмеченные *, обязательны для заполнения.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-200">ID курса *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="course-react-basics"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">Уникальный идентификатор курса (латиница, дефисы)</p>
              </div>
              <div>
                <Label className="text-gray-200">Название *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="React Basics"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-200">Краткое описание *</Label>
                <Textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Изучите основы React..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  rows={2}
                />
                <p className="text-gray-500 text-xs mt-1">Краткое описание, которое будет отображаться в каталоге</p>
              </div>
              <div>
                <Label className="text-gray-200">Полное описание *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробное описание курса..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  rows={4}
                />
                <p className="text-gray-500 text-xs mt-1">Подробное описание курса с деталями и программой</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-200">Уровень *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                      <SelectItem value="beginner" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Beginner</SelectItem>
                      <SelectItem value="intermediate" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Intermediate</SelectItem>
                      <SelectItem value="advanced" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-200">Трек *</Label>
                  <Select value={formData.track_id} onValueChange={(value) => setFormData({ ...formData, track_id: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                      <SelectItem value="digital" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Digital</SelectItem>
                      <SelectItem value="design" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Design</SelectItem>
                      <SelectItem value="event" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Event</SelectItem>
                      <SelectItem value="communication" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-200">Версия</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">Версия курса (по умолчанию 1.0)</p>
              </div>
              <div>
                <Label className="text-gray-200">Срок записи (опционально)</Label>
                <Input
                  type="date"
                  value={formData.enrollment_deadline}
                  onChange={(e) => setFormData({ ...formData, enrollment_deadline: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-gray-500 text-xs mt-1">Дата окончания записи на курс</p>
              </div>
              
              {/* Авторы */}
              <div>
                <Label className="text-gray-200">Авторы курса</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAuthor();
                      }
                    }}
                    placeholder="Введите имя автора"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <Button 
                    type="button" 
                    onClick={addAuthor} 
                    variant="outline"
                    className="border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white"
                  >
                    Добавить
                  </Button>
                </div>
                {formData.authors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.authors.map((author, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-md text-sm border border-blue-600/30"
                      >
                        <span>{author}</span>
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="hover:text-red-400 transition-colors ml-1 text-lg leading-none"
                          title="Удалить автора"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Авторы не добавлены. Нажмите Enter или кнопку "Добавить" чтобы добавить автора.</p>
                )}
              </div>

              {/* Интеграция с графом */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="createGraphNode"
                    checked={graphOptions.createGraphNode}
                    onChange={(e) => setGraphOptions({ ...graphOptions, createGraphNode: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="createGraphNode" className="cursor-pointer text-gray-200">
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
                        onChange={(e) => setGraphOptions({ ...graphOptions, x: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                      <p className="text-gray-500 text-xs mt-1">0 = автопозиционирование</p>
                    </div>
                    <div>
                      <Label className="text-gray-200">Координата Y</Label>
                      <Input
                        type="number"
                        value={graphOptions.y}
                        onChange={(e) => setGraphOptions({ ...graphOptions, y: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                      <p className="text-gray-500 text-xs mt-1">0 = автопозиционирование</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2">
                Создать курс
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <Card className="p-12 bg-gray-900 border-gray-800 border-2 border-dashed">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">Курсы не найдены</p>
              <p className="text-gray-500 text-sm mb-4">Создайте первый курс, чтобы начать работу</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2" size={18} />
                Создать курс
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">ID: {course.id}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        {(course.status || 'draft') !== 'published' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-green-400 hover:bg-gray-800"
                            onClick={() => handlePublish(course.id)}
                            title="Опубликовать курс"
                          >
                            <Globe size={18} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                          title="Редактировать курс"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                          onClick={() => handleDelete(course.id)}
                          title="Удалить курс"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4 line-clamp-2">{course.short_description || course.description || 'Описание отсутствует'}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-600/30">
                        {course.level}
                      </span>
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded-full border border-green-600/30">
                        {course.track_id}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        (course.status || 'draft') === 'published' 
                          ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                          : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                      }`}>
                        {course.status || 'draft'}
                      </span>
                    </div>
                    {(course as any).authors && (course as any).authors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Авторы:</span>
                        {(course as any).authors.map((author: string, idx: number) => (
                          <span key={idx} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {author}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingCourse(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать курс</DialogTitle>
            <DialogDescription className="text-gray-400">
              Измените данные курса. ID курса нельзя изменить. Все поля, отмеченные *, обязательны для заполнения.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID курса</Label>
              <Input
                value={formData.id}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-300 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="React Basics"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-200">Краткое описание *</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Изучите основы React..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                rows={2}
              />
              <p className="text-gray-500 text-xs mt-1">Краткое описание, которое будет отображаться в каталоге</p>
            </div>
            <div>
              <Label className="text-gray-200">Полное описание *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробное описание курса..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                rows={4}
              />
              <p className="text-gray-500 text-xs mt-1">Подробное описание курса с деталями и программой</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-200">Уровень *</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    <SelectItem value="beginner" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Beginner</SelectItem>
                    <SelectItem value="intermediate" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Intermediate</SelectItem>
                    <SelectItem value="advanced" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-200">Трек *</Label>
                <Select value={formData.track_id} onValueChange={(value) => setFormData({ ...formData, track_id: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    <SelectItem value="digital" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Digital</SelectItem>
                    <SelectItem value="design" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Design</SelectItem>
                    <SelectItem value="event" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Event</SelectItem>
                    <SelectItem value="communication" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-gray-200">Версия</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-gray-500 text-xs mt-1">Версия курса (по умолчанию 1.0)</p>
            </div>
            
            <div>
              <Label className="text-gray-200">Срок записи (опционально)</Label>
              <Input
                type="date"
                value={formData.enrollment_deadline}
                onChange={(e) => setFormData({ ...formData, enrollment_deadline: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-gray-500 text-xs mt-1">Дата окончания записи на курс</p>
            </div>
            
            <div>
              <Label className="text-gray-200">Авторы курса</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAuthor();
                    }
                  }}
                  placeholder="Введите имя автора"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button 
                  type="button" 
                  onClick={addAuthor} 
                  variant="outline"
                  className="border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white"
                >
                  Добавить
                </Button>
              </div>
              {formData.authors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.authors.map((author, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-md text-sm border border-blue-600/30"
                    >
                      <span>{author}</span>
                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="hover:text-red-400 transition-colors ml-1 text-lg leading-none"
                        title="Удалить автора"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Авторы не добавлены. Нажмите Enter или кнопку "Добавить" чтобы добавить автора.</p>
              )}
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
