import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Sparkles,
  BookOpen,
  Video,
  Clock,
  Tag,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Check,
  Bold,
  Italic,
  Heading2,
  List,
  Quote,
  Highlighter,
  Link as LinkIcon,
  Loader2
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

export function CreateLessonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillModuleId = searchParams.get('module_id');
  
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoInputValue, setVideoInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<'basic' | 'content' | 'media' | 'review'>('basic');
  
  const [formData, setFormData] = useState<LessonFormData>({
    id: `lesson-${Date.now()}`,
    title: '',
    description: '',
    content: '',
    video_url: '',
    video_duration: '',
    content_type: 'text',
    tags: '',
    estimated_time: 0,
    module_id: prefillModuleId || null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LessonFormData, string>>>({});

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setModulesLoading(true);
      const data = await adminAPI.modules.getAll();
      const modulesList = Array.isArray(data) ? data : [];
      setModules(modulesList);
    } catch (error: any) {
      console.error('Failed to fetch modules:', error);
      toast.error('Ошибка загрузки модулей');
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const validateStep = (step: typeof currentStep): boolean => {
    const newErrors: Partial<Record<keyof LessonFormData, string>> = {};

    if (step === 'basic') {
      if (!formData.id || !formData.id.trim()) {
        newErrors.id = 'ID урока обязателен';
      }
      if (!formData.module_id) {
        newErrors.module_id = 'Выберите модуль';
      }
      if (!formData.title || !formData.title.trim()) {
        newErrors.title = 'Название урока обязательно';
      }
      if (!formData.description || !formData.description.trim()) {
        newErrors.description = 'Описание урока обязательно';
      }
    }

    if (step === 'content') {
      if (!formData.content || !formData.content.trim()) {
        newErrors.content = 'Контент урока обязателен';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const steps: Array<typeof currentStep> = ['basic', 'content', 'media', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps: Array<typeof currentStep> = ['basic', 'content', 'media', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep('basic') || !validateStep('content')) {
      toast.error('Заполните все обязательные поля');
      return;
    }

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
      
      const createData = {
        id: formData.id.trim(),
        module_id: formData.module_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        video_url: formData.video_url?.trim() || null,
        video_duration: formData.video_duration?.trim() || null,
        content_type: formData.content_type || 'text',
        tags: formData.tags?.trim() || null,
        estimated_time: formData.estimated_time || 0,
        order_index: 0,
      };

      await adminAPI.lessons.create(createData);
      
      toast.success('Урок успешно создан!');
      
      // Перенаправление
      if (prefillModuleId || formData.module_id) {
        const moduleId = prefillModuleId || formData.module_id;
        navigate(`/admin/modules/${moduleId}/edit`);
      } else {
        navigate('/admin/lessons');
      }
    } catch (error: any) {
      toast.error(`Ошибка создания урока: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'basic', label: 'Основная информация', icon: BookOpen },
    { id: 'content', label: 'Контент', icon: FileText },
    { id: 'media', label: 'Медиа', icon: Video },
    { id: 'review', label: 'Проверка', icon: CheckCircle2 },
  ];

  const selectedModule = modules.find(m => m.id === formData.module_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (prefillModuleId || formData.module_id) {
                    const moduleId = prefillModuleId || formData.module_id;
                    navigate(`/admin/modules/${moduleId}/edit`);
                  } else {
                    navigate('/admin/lessons');
                  }
                }}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Создать новый урок
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Заполните форму и создайте урок для вашего модуля
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <Card className="p-6 mb-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-lg">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        // Можно переходить только к завершенным шагам или следующему
                        const currentIndex = steps.findIndex(s => s.id === currentStep);
                        if (index <= currentIndex || isCompleted) {
                          setCurrentStep(step.id as typeof currentStep);
                        }
                      }}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <StepIcon size={20} />
                      {isCompleted && !isActive && (
                        <CheckCircle2 className="absolute -top-1 -right-1 h-5 w-5 text-green-600 bg-white rounded-full" />
                      )}
                    </button>
                    <span className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 'basic' && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Основная информация</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    ID урока <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, id: e.target.value }));
                      if (errors.id) setErrors(prev => ({ ...prev, id: undefined }));
                    }}
                    className={`bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 ${
                      errors.id ? 'border-red-500' : ''
                    }`}
                    placeholder="lesson-react-jsx"
                    required
                  />
                  {errors.id && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.id}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    Модуль <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.module_id || ''}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, module_id: value }));
                      if (errors.module_id) setErrors(prev => ({ ...prev, module_id: undefined }));
                    }}
                    disabled={modulesLoading}
                    required
                  >
                    <SelectTrigger className={`bg-white border-slate-300 text-slate-900 ${
                      errors.module_id ? 'border-red-500' : ''
                    }`}>
                      <SelectValue placeholder={modulesLoading ? "Загрузка модулей..." : "Выберите модуль"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-300">
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id} className="hover:bg-slate-100">
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.module_id && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.module_id}
                    </p>
                  )}
                  {modules.length === 0 && !modulesLoading && (
                    <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> Сначала создайте модуль
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    Название урока <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, title: e.target.value }));
                      if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    className={`bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : ''
                    }`}
                    placeholder="Введите название урока"
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.title}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    Описание <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    className={`bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[100px] ${
                      errors.description ? 'border-red-500' : ''
                    }`}
                    placeholder="Краткое описание урока"
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    Тип контента
                  </Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-300">
                      <SelectItem value="text">Текст</SelectItem>
                      <SelectItem value="video">Видео</SelectItem>
                      <SelectItem value="interactive">Интерактивный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    <Clock size={16} /> Время (мин)
                  </Label>
                  <Input
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      setFormData(prev => ({ ...prev, estimated_time: isNaN(num) ? 0 : num }));
                    }}
                    className="bg-white border-slate-300 text-slate-900"
                    min="0"
                    placeholder="30"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Content */}
          {currentStep === 'content' && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Контент урока</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    Конспект занятия <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-t-lg border border-b-0 border-slate-300 mb-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatBold}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Жирный"
                    >
                      <Bold size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatItalic}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Курсив"
                    >
                      <Italic size={16} />
                    </Button>
                    <div className="w-px h-6 bg-slate-300 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatHeading}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Заголовок"
                    >
                      <Heading2 size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatList}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Список"
                    >
                      <List size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatQuote}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Цитата"
                    >
                      <Quote size={16} />
                    </Button>
                    <div className="w-px h-6 bg-slate-300 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatHighlight}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Выделить"
                    >
                      <Highlighter size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={formatLink}
                      className="h-8 w-8 p-0 hover:bg-slate-200"
                      title="Ссылка"
                    >
                      <LinkIcon size={16} />
                    </Button>
                  </div>

                  <Textarea
                    ref={contentTextareaRef}
                    value={formData.content}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, content: e.target.value }));
                      if (errors.content) setErrors(prev => ({ ...prev, content: undefined }));
                    }}
                    className={`bg-white border-slate-300 text-slate-900 font-mono text-sm rounded-t-none min-h-[400px] resize-y ${
                      errors.content ? 'border-red-500' : ''
                    }`}
                    placeholder="Начните писать контент урока здесь..."
                    required
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.content}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-700 font-semibold mb-2 flex items-center gap-2">
                    <Tag size={16} /> Теги (через запятую)
                  </Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="react, jsx, компоненты"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Media */}
          {currentStep === 'media' && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Video className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Медиа материалы</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-slate-700 font-semibold flex items-center gap-2">
                      <Video size={18} /> Видео к уроку
                    </Label>
                    {!showVideoInput && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVideoInput(true)}
                      >
                        Добавить видео
                      </Button>
                    )}
                  </div>

                  {showVideoInput && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex gap-2">
                        <Input
                          value={videoInputValue}
                          onChange={(e) => setVideoInputValue(e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 flex-1"
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
                            asChild
                          >
                            <span className="cursor-pointer">
                              <Upload size={16} className="mr-2" />
                              {uploadingVideo ? 'Загрузка...' : 'Загрузить видео файл'}
                            </span>
                          </Button>
                        </label>
                        {formData.video_url && (
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <CheckCircle2 size={16} className="text-green-600" />
                            Видео: {formData.video_url}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.content_type === 'video' && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-700 font-semibold mb-2">Длительность видео</Label>
                        <Input
                          value={formData.video_duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, video_duration: e.target.value }))}
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="00:15:30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Проверка данных</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">ID урока</p>
                    <p className="font-semibold text-slate-900">{formData.id}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Модуль</p>
                    <p className="font-semibold text-slate-900">{selectedModule?.title || 'Не выбран'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Название</p>
                    <p className="font-semibold text-slate-900">{formData.title || 'Не указано'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Описание</p>
                    <p className="text-slate-900">{formData.description || 'Не указано'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Тип контента</p>
                    <p className="font-semibold text-slate-900 capitalize">{formData.content_type}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Время</p>
                    <p className="font-semibold text-slate-900">{formData.estimated_time} мин</p>
                  </div>
                  {formData.video_url && (
                    <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                      <p className="text-sm text-slate-600 mb-1">Видео</p>
                      <p className="font-semibold text-slate-900 break-all">{formData.video_url}</p>
                    </div>
                  )}
                  {formData.tags && (
                    <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                      <p className="text-sm text-slate-600 mb-1">Теги</p>
                      <p className="font-semibold text-slate-900">{formData.tags}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Контент:</strong> {formData.content.length} символов
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 'basic'}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} className="mr-2" />
              Назад
            </Button>

            <div className="flex gap-3">
              {currentStep !== 'review' ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Далее
                  <ArrowLeft size={16} className="ml-2 rotate-180" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Создать урок
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

