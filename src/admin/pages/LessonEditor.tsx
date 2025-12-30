import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Video, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface LessonFormData {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_duration: string;
  content_type: string;
  tags: string;
  estimated_time: number;
  module_id: string | null;
}

export function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState<LessonFormData>({
    id: '',
    title: '',
    description: '',
    content: '',
    video_url: '',
    video_duration: '',
    content_type: 'text',
    tags: '',
    estimated_time: 0,
    module_id: null,
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadLesson(id);
    } else {
      // Генерируем ID для нового урока
      setFormData(prev => ({
        ...prev,
        id: `lesson-${Date.now()}`,
      }));
    }
  }, [id, isEditMode]);

  const loadLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      const lesson = await adminAPI.lessons.getById(lessonId);
      setFormData({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        video_duration: lesson.video_duration || '',
        content_type: lesson.content_type || 'text',
        tags: lesson.tags || '',
        estimated_time: lesson.estimated_time || 0,
        module_id: lesson.module_id || null,
      });
    } catch (error: any) {
      toast.error(`Ошибка загрузки урока: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем, что ID урока установлен
    if (!formData.id || formData.id.trim() === '') {
      toast.error('Сначала укажите ID урока');
      return;
    }

    // Проверяем тип файла
    if (!file.type.startsWith('video/')) {
      toast.error('Пожалуйста, выберите видео файл');
      return;
    }

    // Проверяем размер файла (макс 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 500MB');
      return;
    }

    try {
      setUploadingVideo(true);
      
      // Создаем FormData для загрузки
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // lesson_id передается как query параметр, не нужно добавлять в FormData

      // Загружаем видео на сервер
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_BASE_URL}/admin/lessons/upload-video?lesson_id=${formData.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки видео');
      }

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        video_url: data.video_url,
        video_duration: data.video_duration || '',
      }));
      
      toast.success('Видео успешно загружено');
    } catch (error: any) {
      toast.error(`Ошибка загрузки видео: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.title) {
      toast.error('Заполните обязательные поля: ID и название');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        await adminAPI.lessons.update(formData.id, formData);
        toast.success('Урок успешно обновлен');
      } else {
        await adminAPI.lessons.create(formData);
        toast.success('Урок успешно создан');
      }
      
      navigate('/admin/lessons');
    } catch (error: any) {
      toast.error(`Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/lessons')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold text-white">
          {isEditMode ? 'Редактировать урок' : 'Создать урок'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Основная информация</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">ID урока *</Label>
                  <Input
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="lesson-1"
                    required
                    disabled={isEditMode}
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Название *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="Название урока"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="Краткое описание урока"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Тип контента</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
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

                <div>
                  <Label className="text-gray-300">Теги (через запятую)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="тег1, тег2, тег3"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Оценка времени (минуты)</Label>
                  <Input
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="30"
                    min="0"
                  />
                </div>
              </div>
            </Card>

            {/* Video Upload */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Video size={20} />
                Видео
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Загрузить видео</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                      disabled={uploadingVideo}
                    />
                    <label htmlFor="video-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        disabled={uploadingVideo}
                        asChild
                      >
                        <span>
                          <Upload size={16} className="mr-2" />
                          {uploadingVideo ? 'Загрузка...' : 'Выбрать видео файл'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {formData.video_url && (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Video size={16} />
                      Видео загружено
                    </div>
                    <div className="text-white text-sm break-all">{formData.video_url}</div>
                    {formData.video_duration && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                        <Clock size={14} />
                        Длительность: {formData.video_duration}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-gray-300">URL видео (если загружено вручную)</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Длительность видео</Label>
                  <Input
                    value={formData.video_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_duration: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="00:15:30"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Content */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Конспект занятия
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Текст конспекта</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1 font-mono text-sm"
                    placeholder="Введите текст конспекта занятия..."
                    rows={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Поддерживается Markdown форматирование
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/lessons')}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={loading || uploadingVideo}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={16} className="mr-2" />
            {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать урок'}
          </Button>
        </div>
      </form>
    </div>
  );
}

