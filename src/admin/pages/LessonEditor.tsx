import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { 
  ArrowLeft, 
  Globe, 
  Video, 
  Upload, 
  Bold, 
  Italic, 
  Heading2, 
  List, 
  Quote,
  Highlighter,
  Link as LinkIcon,
  X,
  Check
} from 'lucide-react';
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

interface Module {
  id: string;
  title: string;
  course_id: string;
}

export function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  
  // Получаем module_id из query параметров для предзаполнения
  const prefillModuleId = searchParams.get('module_id');
  
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoInputValue, setVideoInputValue] = useState('');
  
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
    fetchModules();
    if (isEditMode && id) {
      loadLesson(id);
    } else {
      setFormData(prev => ({
        ...prev,
        id: `lesson-${Date.now()}`,
        module_id: prefillModuleId || null, // Предзаполняем module_id если передан в query
      }));
    }
  }, [id, isEditMode, prefillModuleId]);

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
        module_id: lesson.module_id || prefillModuleId || null,
      });
      if (lesson.video_url) {
        setVideoInputValue(lesson.video_url);
        setShowVideoInput(true);
      }
    } catch (error: any) {
      toast.error(`Ошибка загрузки урока: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Функции форматирования текста
  const insertText = (before: string, after: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || start;
    const selectedText = formData.content.substring(start, end);
    const newText = before + selectedText + after;
    
    const newContent = 
      formData.content.substring(0, start) + 
      newText + 
      formData.content.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    // Устанавливаем курсор после вставленного текста
    setTimeout(() => {
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  };

  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatHeading = () => insertText('### ', '');
  const formatList = () => insertText('- ', '');
  const formatQuote = () => insertText('> ', '');
  const formatLink = () => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || start;
    const selectedText = formData.content.substring(start, end);
    const linkText = selectedText || 'текст ссылки';
    const linkUrl = prompt('Введите URL:', 'https://');
    
    if (linkUrl) {
      insertText(`[${linkText}](`, ')');
      setTimeout(() => {
        const newStart = start + `[${linkText}](`.length;
        textarea.setSelectionRange(newStart, newStart + linkUrl.length);
        const currentContent = formData.content;
        const beforeLink = currentContent.substring(0, newStart);
        const afterLink = currentContent.substring(newStart);
        setFormData(prev => ({
          ...prev,
          content: beforeLink + linkUrl + afterLink
        }));
      }, 10);
    }
  };

  const formatHighlight = () => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || start;
    const selectedText = formData.content.substring(start, end);
    
    const highlightTemplate = selectedText.trim()
      ? `**<span style="background-color: #B6E2C8; padding: 2px 4px;">${selectedText}</span>**`
      : `**<span style="background-color: #B6E2C8; padding: 2px 4px;">[Ключевой термин]</span>**`;

    const newContent = 
      formData.content.substring(0, start) + 
      highlightTemplate + 
      formData.content.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      const newPos = start + highlightTemplate.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  };

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!formData.id || formData.id.trim() === '') {
      toast.error('Сначала укажите ID урока');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Пожалуйста, выберите видео файл');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 500MB');
      return;
    }

    try {
      setUploadingVideo(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

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
      setVideoInputValue(data.video_url);
      setShowVideoInput(true);
      
      toast.success('Видео успешно загружено');
    } catch (error: any) {
      toast.error(`Ошибка загрузки видео: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoUrlSubmit = () => {
    if (videoInputValue.trim()) {
      setFormData(prev => ({
        ...prev,
        video_url: videoInputValue.trim(),
      }));
      toast.success('URL видео сохранен');
    }
  };

  const handleSaveAndPublish = async (e: FormEvent) => {
    e.preventDefault();
    
    // Валидация обязательных полей согласно схеме БД
    if (!formData.id || !formData.id.trim()) {
      toast.error('Заполните обязательное поле: ID урока');
      return;
    }
    if (!formData.module_id) {
      toast.error('Выберите модуль. Урок должен быть привязан к модулю');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      toast.error('Заполните обязательное поле: название урока');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      toast.error('Заполните обязательное поле: описание урока');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      toast.error('Заполните обязательное поле: контент урока');
      return;
    }

    try {
      setLoading(true);
      
      // Подготавливаем данные согласно схеме LessonCreate/LessonUpdate
      if (isEditMode) {
        // При обновлении используем LessonUpdate - все поля опциональны
        const updateData: any = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          video_url: formData.video_url?.trim() || null,
          video_duration: formData.video_duration?.trim() || null,
          content_type: formData.content_type || 'text',
          tags: formData.tags?.trim() || null,
          estimated_time: formData.estimated_time || 0,
        };
        // module_id можно изменить при обновлении
        if (formData.module_id) {
          updateData.module_id = formData.module_id;
        }
        await adminAPI.lessons.update(formData.id, updateData);
      } else {
        // При создании используем LessonCreate - обязательные поля
        const createData = {
          id: formData.id.trim(),
          module_id: formData.module_id, // Обязательно
          title: formData.title.trim(),
          description: formData.description.trim(), // Обязательно
          content: formData.content.trim(), // Обязательно
          video_url: formData.video_url?.trim() || null,
          video_duration: formData.video_duration?.trim() || null,
          content_type: formData.content_type || 'text',
          tags: formData.tags?.trim() || null,
          estimated_time: formData.estimated_time || 0,
          order_index: 0, // Будет установлен автоматически на бэкенде
        };
        await adminAPI.lessons.create(createData);
      }
      
      // Затем публикуем
      await adminAPI.lessons.publish(formData.id);
      
      toast.success('Урок успешно сохранен и опубликован на платформе!');
      
      // Если был передан module_id, возвращаемся на страницу модуля
      if (prefillModuleId || formData.module_id) {
        const moduleId = prefillModuleId || formData.module_id;
        navigate(`/admin/modules/${moduleId}/edit`);
      } else {
        navigate('/admin/lessons');
      }
    } catch (error: any) {
      toast.error(`Ошибка сохранения и публикации: ${error.message || 'Неизвестная ошибка'}`);
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
                onClick={() => {
                  // Если был передан module_id, возвращаемся на страницу модуля
                  if (prefillModuleId || formData.module_id) {
                    const moduleId = prefillModuleId || formData.module_id;
                    navigate(`/admin/modules/${moduleId}/edit`);
                  } else {
                    navigate('/admin/lessons');
                  }
                }}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {isEditMode ? 'Редактировать урок' : 'Создать урок'}
                </h1>
                <p className="text-sm text-gray-700 mt-1">
                  Заполните форму и опубликуйте урок на платформе
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
                <Label className="text-black font-semibold">ID урока *</Label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="lesson-1"
                  required
                  disabled={isEditMode}
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Название урока *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Введите название урока"
                  required
                />
              </div>

              <div>
                <Label className="text-black font-semibold">Модуль *</Label>
                <Select
                  value={formData.module_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}
                  required
                >
                    <SelectTrigger className="bg-white border-gray-300 text-black placeholder:text-gray-600 mt-2">
                      <SelectValue placeholder="Выберите модуль (обязательно)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 text-black shadow-lg">
                      {modules.length === 0 ? (
                        <SelectItem value="" disabled className="bg-white text-gray-400">
                          Нет доступных модулей. Сначала создайте модуль.
                        </SelectItem>
                      ) : (
                        modules.map((module) => (
                          <SelectItem key={module.id} value={module.id} className="bg-white text-black hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                            {module.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                </Select>
                <p className="text-gray-600 text-xs mt-1">Урок должен быть привязан к модулю</p>
              </div>

              <div>
                <Label className="text-black font-semibold">Описание *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white border-gray-300 text-black mt-2"
                  placeholder="Краткое описание урока"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Видео */}
          <Card className="bg-white border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-black font-semibold flex items-center gap-2">
                <Video size={18} />
                Видео к уроку
              </Label>
              {!showVideoInput && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVideoInput(true)}
                  className="text-xs"
                >
                  Добавить видео
                </Button>
              )}
            </div>

            {showVideoInput && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={videoInputValue}
                    onChange={(e) => setVideoInputValue(e.target.value)}
                    className="bg-white border-gray-300 text-black flex-1"
                    placeholder="Вставьте URL видео или загрузите файл"
                  />
                  <Button
                    type="button"
                    onClick={handleVideoUrlSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowVideoInput(false);
                      setVideoInputValue('');
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
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
                      disabled={uploadingVideo}
                      className="text-sm"
                      asChild
                    >
                      <span>
                        <Upload size={16} className="mr-2" />
                        {uploadingVideo ? 'Загрузка...' : 'Загрузить видео файл'}
                      </span>
                    </Button>
                  </label>
                  {formData.video_url && (
                    <span className="text-sm text-gray-600">
                      ✓ Видео: {formData.video_url}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Редактор контента */}
          <Card className="bg-white border-gray-200 p-6">
            <Label className="text-black font-semibold mb-4 block">
              Конспект занятия *
            </Label>

            {/* Панель инструментов */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-t-lg border border-b-0 border-gray-300">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatBold}
                className="h-8 w-8 p-0"
                title="Жирный (Ctrl+B)"
              >
                <Bold size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatItalic}
                className="h-8 w-8 p-0"
                title="Курсив (Ctrl+I)"
              >
                <Italic size={16} />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatHeading}
                className="h-8 w-8 p-0"
                title="Заголовок"
              >
                <Heading2 size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatList}
                className="h-8 w-8 p-0"
                title="Список"
              >
                <List size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatQuote}
                className="h-8 w-8 p-0"
                title="Цитата"
              >
                <Quote size={16} />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatHighlight}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                title="Выделить текст"
              >
                <Highlighter size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={formatLink}
                className="h-8 w-8 p-0"
                title="Ссылка"
              >
                <LinkIcon size={16} />
              </Button>
            </div>

            {/* Текстовый редактор */}
            <Textarea
              ref={contentTextareaRef}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="bg-white border-gray-300 text-black font-mono text-sm rounded-t-none min-h-[500px] resize-y"
              placeholder="Начните писать конспект урока здесь...

Вы можете использовать:
- **жирный текст**
- *курсив*
- ### Заголовки
- Списки
- > Цитаты
- [Ссылки](https://example.com)

Или выделите текст и используйте кнопки форматирования выше."
              required
            />

            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-gray-700">
                💡 <strong>Совет:</strong> Выделите текст и нажмите кнопку "Выделить" для создания красивых выделений с зеленым фоном
              </p>
            </div>
          </Card>

          {/* Кнопка публикации */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-300 p-6 -mx-6 shadow-2xl z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Если был передан module_id, возвращаемся на страницу модуля
                  if (prefillModuleId || formData.module_id) {
                    const moduleId = prefillModuleId || formData.module_id;
                    navigate(`/admin/modules/${moduleId}/edit`);
                  } else {
                    navigate('/admin/lessons');
                  }
                }}
                className="bg-white border-gray-300 text-black hover:bg-gray-50 px-6"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingVideo}
                className="bg-green-600 hover:bg-green-700 px-10 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Globe size={20} className="mr-2" />
                {loading ? 'Публикация...' : 'Опубликовать урок'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
