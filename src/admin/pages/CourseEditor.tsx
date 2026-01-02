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
import { ArrowLeft, Globe, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface CourseFormData {
  id: string;
  track_id: string;
  title: string;
  description: string;
  short_description: string;
  level: string;
  version: string;
  enrollment_deadline: string;
  authors: string[];
}

interface Track {
  id: string;
  name: string;
}

// 4 фиксированных курса
const FIXED_COURSES = [
  { id: 'design', title: 'Дизайн', track: 'design' },
  { id: 'event-basics', title: 'Ивент', track: 'event' },
  { id: 'product-intro', title: 'Цифровые продукты', track: 'digital' },
  { id: 'business-comm', title: 'Внешние коммуникации', track: 'communication' },
];

export function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [authorsInput, setAuthorsInput] = useState('');
  
  const [formData, setFormData] = useState<CourseFormData>({
    id: '',
    track_id: 'digital',
    title: '',
    description: '',
    short_description: '',
    level: 'beginner',
    version: '1.0',
    enrollment_deadline: '',
    authors: [],
  });

  useEffect(() => {
    fetchTracks();
    if (isEditMode && id) {
      // Проверяем, что курс существует в списке фиксированных
      const fixedCourse = FIXED_COURSES.find(c => c.id === id);
      if (!fixedCourse) {
        toast.error('Курс не найден. Можно редактировать только существующие 4 курса.');
        navigate('/admin/courses');
        return;
      }
      loadCourse(id);
    } else {
      // В режиме создания не разрешаем создавать новые курсы
      // Можно только редактировать существующие 4 курса
      toast.error('Можно редактировать только существующие 4 курса');
      navigate('/admin/courses');
    }
  }, [id, isEditMode]);

  const fetchTracks = async () => {
    try {
      const data = await adminAPI.tracks.getAll();
      const tracksList = Array.isArray(data) ? data : [];
      setTracks(tracksList);
    } catch (error: any) {
      console.error('Failed to fetch tracks:', error);
      setTracks([]);
    }
  };

  const loadCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const course = await adminAPI.courses.getById(courseId);
      setFormData({
        id: course.id,
        track_id: course.track_id,
        title: course.title,
        description: course.description || '',
        short_description: course.short_description || '',
        level: course.level || 'beginner',
        version: course.version || '1.0',
        enrollment_deadline: course.enrollment_deadline || '',
        authors: course.authors || [],
      });
      setAuthorsInput((course.authors || []).join(', '));
    } catch (error: any) {
      toast.error(`Ошибка загрузки курса: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.title || !formData.track_id) {
      toast.error('Заполните обязательные поля: ID, название и трек');
      return;
    }

    try {
      setLoading(true);
      
      // Обрабатываем авторов
      const authors = authorsInput
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const courseData = {
        ...formData,
        authors,
      };
      
      // Сначала сохраняем курс
      if (isEditMode) {
        await adminAPI.courses.update(formData.id, courseData);
      } else {
        await adminAPI.courses.create(courseData);
      }
      
      // Публикуем курс
      await adminAPI.courses.publish(formData.id);
      
      toast.success('Курс успешно сохранен и опубликован!');
      navigate('/admin/courses');
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
                onClick={() => navigate('/admin/courses')}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {isEditMode ? 'Редактировать курс' : 'Создать курс'}
                </h1>
                <p className="text-sm text-gray-700 mt-1">
                  Заполните форму и опубликуйте курс на платформе
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
                <Label className="text-black font-semibold">ID курса *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="course-1"
                  required
                  disabled={true}
                />
                <p className="text-gray-700 text-xs mt-1">ID курса нельзя изменить</p>
              </div>

              <div>
                <Label className="text-black font-semibold">Трек *</Label>
                <Select
                  value={formData.track_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, track_id: value }))}
                  required
                  disabled={true}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black placeholder:text-gray-600 mt-2">
                    <SelectValue placeholder="Выберите трек" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-black shadow-lg">
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id} className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-gray-700 text-xs mt-1">Трек курса нельзя изменить</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-black font-semibold">Название курса *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Введите название курса"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-black font-semibold">Краткое описание</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Краткое описание курса"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-black font-semibold">Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Полное описание курса"
                  rows={6}
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Уровень</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black placeholder:text-gray-600 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-black shadow-lg">
                    <SelectItem value="beginner" className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">Начинающий</SelectItem>
                    <SelectItem value="intermediate" className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">Средний</SelectItem>
                    <SelectItem value="advanced" className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">Продвинутый</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-black font-semibold">Версия</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="1.0"
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Дедлайн записи</Label>
                <Input
                  value={formData.enrollment_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, enrollment_deadline: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="31 декабря 2025"
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Авторы (через запятую)</Label>
                <Input
                  value={authorsInput}
                  onChange={(e) => setAuthorsInput(e.target.value)}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Иван Иванов, Петр Петров"
                />
              </div>
            </div>
          </Card>

          {/* Кнопка публикации */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-300 p-6 -mx-6 shadow-2xl z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/courses')}
                className="bg-white border-gray-300 text-black hover:bg-gray-50 px-6"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Globe size={20} className="mr-2" />
                {loading ? 'Публикация...' : 'Опубликовать курс'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

