import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CheckCircle, XCircle, Clock, Edit, Trash2, FileText, Link as LinkIcon, Upload } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { useApiQuery, useApiMutation } from '../hooks';
import { LoadingState, ErrorState, EmptyState, ConfirmDialog, SearchBar, FormField } from '../components';
import { useFormValidation } from '../hooks';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  lesson_id: string;
  description: string;
  criteria: string;
  requires_text: boolean;
  requires_file: boolean;
  requires_link: boolean;
}

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  status: string;
  text_answer?: string;
  link_url?: string;
  file_urls?: string[];
  submitted_at?: string;
  curator_comment?: string;
  reviewed_at?: string;
  user?: {
    username: string;
    email: string;
  };
  assignment?: {
    description: string;
  };
}

export function AssignmentsManagement() {
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; assignmentId: string | null }>({
    open: false,
    assignmentId: null,
  });

  // Загрузка данных
  const { data: assignmentsData, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useApiQuery(
    () => adminAPI.assignments.getAll(),
    { cacheTime: 2 * 60 * 1000 }
  );

  const { data: submissionsData, loading: submissionsLoading, error: submissionsError, refetch: refetchSubmissions } = useApiQuery(
    () => adminAPI.submissions.getAll(),
    { cacheTime: 1 * 60 * 1000 }
  );

  const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
  const submissions = Array.isArray(submissionsData) ? submissionsData : [];

  // Фильтрация submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission: Submission) => {
      const matchesSearch = !searchQuery || 
        submission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (submission.user?.username && submission.user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (submission.user?.email && submission.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Форма для задания
  const formValidation = useFormValidation(
    {
      id: '',
      lesson_id: '',
      description: '',
      criteria: '',
      requires_text: false,
      requires_file: false,
      requires_link: false,
    },
    {
      rules: {
        id: {
          required: true,
          minLength: 3,
          pattern: /^[a-z0-9_-]+$/,
        },
        lesson_id: {
          required: true,
          minLength: 3,
        },
        description: {
          required: true,
          minLength: 10,
        },
        criteria: {
          required: true,
          minLength: 5,
        },
      },
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  const formData = formValidation.data;
  const { setFieldValue, handleBlur, validate, errors, reset: resetForm } = formValidation;

  // Форма для оценки
  const [gradeComment, setGradeComment] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'accepted' | 'needs_revision'>('accepted');

  // Мутации
  const createMutation = useApiMutation(
    (data: any) => adminAPI.assignments.create(data),
    {
      invalidateQueries: ['assignments'],
      successMessage: 'Задание успешно создано',
      onSuccess: () => {
        refetchAssignments();
      },
    }
  );

  const updateMutation = useApiMutation(
    (data: { id: string; data: any }) => adminAPI.assignments.update(data.id, data.data),
    {
      invalidateQueries: ['assignments'],
      successMessage: 'Задание успешно обновлено',
      onSuccess: () => {
        refetchAssignments();
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => adminAPI.assignments.delete(id),
    {
      invalidateQueries: ['assignments'],
      successMessage: 'Задание успешно удалено',
      onSuccess: () => {
        refetchAssignments();
      },
    }
  );

  const gradeMutation = useApiMutation(
    (data: { id: string; status: string; comment?: string }) => 
      adminAPI.submissions.grade(data.id, data.status, data.comment),
    {
      invalidateQueries: ['submissions'],
      successMessage: 'Работа оценена',
      onSuccess: () => {
        refetchSubmissions();
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
      lesson_id: formData.lesson_id.trim(),
      description: formData.description.trim(),
      criteria: formData.criteria.trim(),
      requires_text: formData.requires_text,
      requires_file: formData.requires_file,
      requires_link: formData.requires_link,
    };

    await createMutation.mutate(createData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;
    if (!validate()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

    const updateData = {
      lesson_id: formData.lesson_id.trim(),
      description: formData.description.trim(),
      criteria: formData.criteria.trim(),
      requires_text: formData.requires_text,
      requires_file: formData.requires_file,
      requires_link: formData.requires_link,
    };

    await updateMutation.mutate({ id: editingAssignment.id, data: updateData });
    setIsEditDialogOpen(false);
    setEditingAssignment(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteConfirm.assignmentId) return;
    await deleteMutation.mutate(deleteConfirm.assignmentId);
    setDeleteConfirm({ open: false, assignmentId: null });
  };

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    
    await gradeMutation.mutate({
      id: gradingSubmission.id,
      status: gradeStatus,
      comment: gradeComment.trim() || undefined,
    });
    
    setIsGradeDialogOpen(false);
    setGradingSubmission(null);
    setGradeComment('');
    setGradeStatus('accepted');
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    resetForm({
      id: assignment.id,
      lesson_id: assignment.lesson_id,
      description: assignment.description,
      criteria: assignment.criteria,
      requires_text: assignment.requires_text,
      requires_file: assignment.requires_file,
      requires_link: assignment.requires_link,
    });
    setIsEditDialogOpen(true);
  };

  const openGradeDialog = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeComment(submission.curator_comment || '');
    setGradeStatus(submission.status === 'needs_revision' ? 'needs_revision' : 'accepted');
    setIsGradeDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Принято</Badge>;
      case 'needs_revision':
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Требует доработки</Badge>;
      case 'pending':
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">На проверке</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'needs_revision':
        return <XCircle className="text-yellow-500" size={20} />;
      case 'pending':
        return <Clock className="text-blue-500" size={20} />;
      default:
        return null;
    }
  };

  if (assignmentsLoading || submissionsLoading) {
    return <LoadingState message="Загрузка данных..." />;
  }

  if (assignmentsError || submissionsError) {
    return (
      <ErrorState 
        error={assignmentsError || submissionsError} 
        title="Ошибка загрузки данных"
        onRetry={() => {
          refetchAssignments();
          refetchSubmissions();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление заданиями</h1>
          <p className="text-gray-300 text-sm">
            Создание заданий и проверка работ студентов
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2" size={20} />
          Создать задание
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assignments' | 'submissions')} className="space-y-4">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="assignments" className="data-[state=active]:bg-gray-800">
            Задания ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-gray-800">
            Проверка работ ({submissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Задания не найдены"
              description="Создайте первое задание для студентов"
              actionLabel="Создать задание"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment: Assignment) => (
                <Card key={assignment.id} className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">ID: {assignment.id}</h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.requires_text && (
                          <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                            <FileText className="mr-1" size={12} />
                            Текст
                          </Badge>
                        )}
                        {assignment.requires_file && (
                          <Badge variant="outline" className="border-green-600/30 text-green-400">
                            <Upload className="mr-1" size={12} />
                            Файл
                          </Badge>
                        )}
                        {assignment.requires_link && (
                          <Badge variant="outline" className="border-purple-600/30 text-purple-400">
                            <LinkIcon className="mr-1" size={12} />
                            Ссылка
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-300 hover:text-blue-400"
                        onClick={() => openEditDialog(assignment)}
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-300 hover:text-red-400"
                        onClick={() => setDeleteConfirm({ open: true, assignmentId: assignment.id })}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-gray-400 text-xs">Урок: {assignment.lesson_id}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {/* Фильтры */}
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  placeholder="Поиск по ID, пользователю, email..."
                  onSearch={setSearchQuery}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
              >
                <option value="all">Все статусы</option>
                <option value="pending">На проверке</option>
                <option value="accepted">Принято</option>
                <option value="needs_revision">Требует доработки</option>
              </select>
            </div>
            <div className="mt-3 text-sm text-gray-300">
              Найдено работ: {filteredSubmissions.length} из {submissions.length}
            </div>
          </Card>

          {filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Работы не найдены"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Попробуйте изменить параметры поиска или фильтры'
                  : 'Нет работ для проверки'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission: Submission) => (
                <Card key={submission.id} className="bg-gray-900 border-gray-800 p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(submission.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-white">Работа #{submission.id}</h3>
                          <p className="text-gray-300 text-sm">
                            Пользователь: {submission.user?.username || submission.user_id}
                            {submission.user?.email && ` (${submission.user.email})`}
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>

                      {submission.assignment && (
                        <div className="mb-3 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-400 mb-1">Задание:</p>
                          <p className="text-gray-200 text-sm">{submission.assignment.description}</p>
                        </div>
                      )}

                      {submission.text_answer && (
                        <div className="mb-3 p-3 bg-gray-800 rounded">
                          <p className="text-sm font-semibold text-gray-300 mb-1">Текстовый ответ:</p>
                          <p className="text-gray-200 text-sm whitespace-pre-wrap">{submission.text_answer}</p>
                        </div>
                      )}

                      {submission.link_url && (
                        <div className="mb-3">
                          <a
                            href={submission.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
                          >
                            <LinkIcon size={16} />
                            {submission.link_url}
                          </a>
                        </div>
                      )}

                      {submission.file_urls && submission.file_urls.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-300 mb-2">Файлы:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.file_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                              >
                                <Upload size={14} />
                                Файл {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.submitted_at && (
                        <p className="text-gray-400 text-xs mb-2">
                          Отправлено: {new Date(submission.submitted_at).toLocaleString('ru-RU')}
                        </p>
                      )}

                      {submission.curator_comment && (
                        <div className="mt-3 p-3 bg-yellow-900/20 rounded border-l-4 border-yellow-500">
                          <p className="text-sm font-semibold text-yellow-400 mb-1">Комментарий куратора:</p>
                          <p className="text-gray-200 text-sm">{submission.curator_comment}</p>
                          {submission.reviewed_at && (
                            <p className="text-gray-400 text-xs mt-2">
                              Проверено: {new Date(submission.reviewed_at).toLocaleString('ru-RU')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {submission.status === 'pending' && (
                      <div className="ml-4">
                        <Button
                          onClick={() => openGradeDialog(submission)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          Оценить
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать задание</DialogTitle>
            <DialogDescription className="text-gray-300">
              Заполните форму для создания нового задания
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <FormField
              type="input"
              label="ID задания"
              value={formData.id}
              onChange={(value) => setFieldValue('id', value)}
              onBlur={() => handleBlur('id')}
              error={errors.id}
              required
              hint="Уникальный идентификатор (латиница, дефисы, подчеркивания)"
            />

            <FormField
              type="input"
              label="ID урока"
              value={formData.lesson_id}
              onChange={(value) => setFieldValue('lesson_id', value)}
              onBlur={() => handleBlur('lesson_id')}
              error={errors.lesson_id}
              required
            />

            <FormField
              type="textarea"
              label="Описание задания"
              value={formData.description}
              onChange={(value) => setFieldValue('description', value)}
              onBlur={() => handleBlur('description')}
              error={errors.description}
              required
              rows={4}
            />

            <FormField
              type="textarea"
              label="Критерии оценки"
              value={formData.criteria}
              onChange={(value) => setFieldValue('criteria', value)}
              onBlur={() => handleBlur('criteria')}
              error={errors.criteria}
              required
              rows={4}
              hint="Опишите критерии оценки работы"
            />

            <div className="space-y-3">
              <label className="text-gray-200 text-sm font-medium">Тип ответа</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="text"
                    checked={formData.requires_text}
                    onCheckedChange={(checked) => setFieldValue('requires_text', checked as boolean)}
                  />
                  <label htmlFor="text" className="text-sm text-gray-200 cursor-pointer">
                    Текстовый ответ
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="file"
                    checked={formData.requires_file}
                    onCheckedChange={(checked) => setFieldValue('requires_file', checked as boolean)}
                  />
                  <label htmlFor="file" className="text-sm text-gray-200 cursor-pointer">
                    Файл
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="link"
                    checked={formData.requires_link}
                    onCheckedChange={(checked) => setFieldValue('requires_link', checked as boolean)}
                  />
                  <label htmlFor="link" className="text-sm text-gray-200 cursor-pointer">
                    Ссылка
                  </label>
                </div>
              </div>
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
                {createMutation.loading ? 'Создание...' : 'Создать задание'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingAssignment(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать задание</DialogTitle>
            <DialogDescription className="text-gray-300">
              Измените данные задания. ID нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <FormField
              type="input"
              label="ID задания"
              value={formData.id}
              onChange={() => {}}
              hint="ID нельзя изменить"
            />

            <FormField
              type="input"
              label="ID урока"
              value={formData.lesson_id}
              onChange={(value) => setFieldValue('lesson_id', value)}
              onBlur={() => handleBlur('lesson_id')}
              error={errors.lesson_id}
              required
            />

            <FormField
              type="textarea"
              label="Описание задания"
              value={formData.description}
              onChange={(value) => setFieldValue('description', value)}
              onBlur={() => handleBlur('description')}
              error={errors.description}
              required
              rows={4}
            />

            <FormField
              type="textarea"
              label="Критерии оценки"
              value={formData.criteria}
              onChange={(value) => setFieldValue('criteria', value)}
              onBlur={() => handleBlur('criteria')}
              error={errors.criteria}
              required
              rows={4}
            />

            <div className="space-y-3">
              <label className="text-gray-200 text-sm font-medium">Тип ответа</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-text"
                    checked={formData.requires_text}
                    onCheckedChange={(checked) => setFieldValue('requires_text', checked as boolean)}
                  />
                  <label htmlFor="edit-text" className="text-sm text-gray-200 cursor-pointer">
                    Текстовый ответ
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-file"
                    checked={formData.requires_file}
                    onCheckedChange={(checked) => setFieldValue('requires_file', checked as boolean)}
                  />
                  <label htmlFor="edit-file" className="text-sm text-gray-200 cursor-pointer">
                    Файл
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-link"
                    checked={formData.requires_link}
                    onCheckedChange={(checked) => setFieldValue('requires_link', checked as boolean)}
                  />
                  <label htmlFor="edit-link" className="text-sm text-gray-200 cursor-pointer">
                    Ссылка
                  </label>
                </div>
              </div>
            </div>

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

      {/* Grade Submission Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Оценить работу</DialogTitle>
            <DialogDescription className="text-gray-300">
              Выберите статус и оставьте комментарий для студента
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {gradingSubmission && (
              <>
                <FormField
                  type="select"
                  label="Статус"
                  value={gradeStatus}
                  onChange={(value) => setGradeStatus(value as 'accepted' | 'needs_revision')}
                  options={[
                    { value: 'accepted', label: 'Принято' },
                    { value: 'needs_revision', label: 'Требует доработки' },
                  ]}
                  required
                />

                <FormField
                  type="textarea"
                  label="Комментарий куратора"
                  value={gradeComment}
                  onChange={setGradeComment}
                  rows={6}
                  hint="Оставьте комментарий для студента с рекомендациями"
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setIsGradeDialogOpen(false)}
                    variant="outline"
                    className="flex-1 border-gray-700"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleGrade}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={gradeMutation.loading}
                  >
                    {gradeMutation.loading ? 'Сохранение...' : 'Сохранить оценку'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, assignmentId: deleteConfirm.assignmentId })}
        title="Удалить задание?"
        description="Это действие нельзя отменить. Все связанные работы студентов также будут удалены."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
