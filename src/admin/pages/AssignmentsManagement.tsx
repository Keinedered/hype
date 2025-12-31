import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, CheckCircle, XCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

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
  submitted_at?: string;
  curator_comment?: string;
  reviewed_at?: string;
}

export function AssignmentsManagement() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeComment, setGradeComment] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'accepted' | 'needs_revision'>('accepted');
  const [formData, setFormData] = useState({
    id: '',
    lesson_id: '',
    description: '',
    criteria: '',
    requires_text: false,
    requires_file: false,
    requires_link: false,
  });

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await adminAPI.assignments.getAll();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch assignments:', error);
      toast.error(error.message || 'Ошибка загрузки заданий');
      setAssignments([]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const data = await adminAPI.submissions.getAll();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error);
      toast.error(error.message || 'Ошибка загрузки работ');
      setSubmissions([]);
    }
  };

  const handleCreate = async () => {
    // Валидация
    if (!formData.id || !formData.id.trim()) {
      toast.error('Введите ID задания');
      return;
    }
    if (!formData.lesson_id || !formData.lesson_id.trim()) {
      toast.error('Введите ID урока');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      toast.error('Введите описание задания');
      return;
    }
    if (!formData.criteria || !formData.criteria.trim()) {
      toast.error('Введите критерии оценки');
      return;
    }

    try {
      const createData = {
        id: formData.id.trim(),
        lesson_id: formData.lesson_id.trim(),
        description: formData.description.trim(),
        criteria: formData.criteria.trim(),
        requires_text: formData.requires_text,
        requires_file: formData.requires_file,
        requires_link: formData.requires_link,
      };

      await adminAPI.assignments.create(createData);
      toast.success('Задание успешно создано');
      fetchAssignments();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании задания');
    }
  };

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    
    try {
      await adminAPI.submissions.grade(
        gradingSubmission.id, 
        gradeStatus, 
        gradeComment?.trim() || undefined
      );
      toast.success('Работа оценена');
      fetchSubmissions();
      setIsGradeDialogOpen(false);
      setGradingSubmission(null);
      setGradeComment('');
      setGradeStatus('accepted');
    } catch (error: any) {
      console.error('Failed to grade submission:', error);
      toast.error(error.message || 'Ошибка при оценке работы');
    }
  };

  const openGradeDialog = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeComment(submission.curator_comment || '');
    setGradeStatus(submission.status === 'needs_revision' ? 'needs_revision' : 'accepted');
    setIsGradeDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

    try {
      await adminAPI.assignments.update(editingAssignment.id, formData);
      toast.success('Задание успешно обновлено');
      fetchAssignments();
      setEditingAssignment(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении задания');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить задание?')) return;

    try {
      await adminAPI.assignments.delete(id);
      toast.success('Задание успешно удалено');
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении задания');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      lesson_id: '',
      description: '',
      criteria: '',
      requires_text: false,
      requires_file: false,
      requires_link: false,
    });
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'needs_revision':
        return <XCircle className="text-red-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Tabs defaultValue="assignments" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="assignments" className="data-[state=active]:bg-gray-800">
              Задания
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-gray-800">
              Проверка работ
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2" size={20} />
            Создать задание
          </Button>
        </div>

        <TabsContent value="assignments" className="space-y-4">
          {assignments.length === 0 ? (
            <Card className="p-6 bg-gray-900 border-gray-800">
              <p className="text-gray-400 text-center">Задания не найдены. Создайте первое задание.</p>
            </Card>
          ) : (
            assignments.map((assignment) => (
            <Card key={assignment.id} className="p-6 bg-gray-900 border-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Задание: {assignment.id}</h3>
                  <p className="text-gray-400 mb-2">{assignment.description}</p>
                  <div className="flex gap-2">
                    {assignment.requires_text && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Текст</span>
                    )}
                    {assignment.requires_file && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Файл</span>
                    )}
                    {assignment.requires_link && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Ссылка</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => openEditDialog(assignment)}
                  >
                    <Edit size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Card className="p-6 bg-gray-900 border-gray-800">
              <p className="text-gray-400 text-center">Работы студентов не найдены.</p>
            </Card>
          ) : (
            submissions.map((submission) => (
            <Card key={submission.id} className="p-6 bg-gray-900 border-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(submission.status)}
                    <h3 className="text-lg font-bold text-white">
                      Submission ID: {submission.id}
                    </h3>
                  </div>
                  <p className="text-gray-400">User: {submission.user_id}</p>
                  <p className="text-gray-400">Assignment: {submission.assignment_id}</p>
                  {submission.text_answer && (
                    <p className="text-gray-200 mt-2">{submission.text_answer}</p>
                  )}
                  {submission.link_url && (
                    <a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mt-2 block">
                      {submission.link_url}
                    </a>
                  )}
                  {submission.submitted_at && (
                    <p className="text-gray-500 text-xs mt-2">Отправлено: {new Date(submission.submitted_at).toLocaleString('ru-RU')}</p>
                  )}
                  {submission.curator_comment && (
                    <div className="mt-3 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-semibold text-blue-400 mb-1">Комментарий куратора:</p>
                      <p className="text-gray-200 text-sm">{submission.curator_comment}</p>
                      {submission.reviewed_at && (
                        <p className="text-gray-500 text-xs mt-2">Проверено: {new Date(submission.reviewed_at).toLocaleString('ru-RU')}</p>
                      )}
                    </div>
                  )}
                </div>
                {submission.status === 'pending' && (
                  <div className="flex gap-2">
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
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать задание</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>ID задания</Label>
              <Input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="assignment-1"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>ID урока</Label>
              <Input
                value={formData.lesson_id}
                onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                placeholder="lesson-1"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Создайте приложение..."
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>
            <div>
              <Label>Критерии оценки</Label>
              <Textarea
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                placeholder="1. Корректная работа\n2. Чистый код..."
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип ответа</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="text"
                  checked={formData.requires_text}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_text: checked as boolean })
                  }
                />
                <label htmlFor="text" className="text-sm text-gray-200">
                  Текстовый ответ
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="file"
                  checked={formData.requires_file}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_file: checked as boolean })
                  }
                />
                <label htmlFor="file" className="text-sm text-gray-200">
                  Файл
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="link"
                  checked={formData.requires_link}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_link: checked as boolean })
                  }
                />
                <label htmlFor="link" className="text-sm text-gray-200">
                  Ссылка
                </label>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
              Создать задание
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать задание</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>ID задания</Label>
              <Input
                value={formData.id}
                disabled
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>ID урока</Label>
              <Input
                value={formData.lesson_id}
                onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                placeholder="lesson-1"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Создайте приложение..."
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>
            <div>
              <Label>Критерии оценки</Label>
              <Textarea
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                placeholder="1. Корректная работа\n2. Чистый код..."
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип ответа</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-text"
                  checked={formData.requires_text}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_text: checked as boolean })
                  }
                />
                <label htmlFor="edit-text" className="text-sm text-gray-200">
                  Текстовый ответ
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-file"
                  checked={formData.requires_file}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_file: checked as boolean })
                  }
                />
                <label htmlFor="edit-file" className="text-sm text-gray-200">
                  Файл
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-link"
                  checked={formData.requires_link}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_link: checked as boolean })
                  }
                />
                <label htmlFor="edit-link" className="text-sm text-gray-200">
                  Ссылка
                </label>
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full bg-blue-600 hover:bg-blue-700">
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Оценить работу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {gradingSubmission && (
              <>
                <div>
                  <Label>Статус</Label>
                  <Select value={gradeStatus} onValueChange={(value: 'accepted' | 'needs_revision') => setGradeStatus(value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white shadow-lg">
                      <SelectItem value="accepted" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Принято</SelectItem>
                      <SelectItem value="needs_revision" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">Требует доработки</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Комментарий куратора</Label>
                  <Textarea
                    value={gradeComment}
                    onChange={(e) => setGradeComment(e.target.value)}
                    placeholder="Введите комментарий..."
                    className="bg-gray-800 border-gray-700"
                    rows={4}
                  />
                </div>
                <Button onClick={handleGrade} className="w-full bg-blue-600 hover:bg-blue-700">
                  Сохранить оценку
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
