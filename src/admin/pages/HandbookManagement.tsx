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
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface Article {
  id: string;
  section_id: string;
  title: string;
  content: string;
  tags?: string;
}

export function HandbookManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    section_id: 'section-1',
    title: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await adminAPI.handbook.getArticles();
      setArticles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch articles:', error);
      toast.error(error.message || 'Ошибка загрузки статей');
      setArticles([]);
    }
  };

  const handleCreate = async () => {
    // Валидация
    if (!formData.id || !formData.id.trim()) {
      toast.error('Введите ID статьи');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название статьи');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      toast.error('Введите содержание статьи');
      return;
    }
    if (!formData.section_id || !formData.section_id.trim()) {
      toast.error('Введите ID секции');
      return;
    }

    try {
      const createData = {
        id: formData.id.trim(),
        section_id: formData.section_id.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags?.trim() || null,
      };

      await adminAPI.handbook.createArticle(createData);
      toast.success('Статья успешно создана');
      fetchArticles();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании статьи');
    }
  };

  const handleUpdate = async () => {
    if (!editingArticle) return;

    // Валидация
    if (!formData.title || !formData.title.trim()) {
      toast.error('Введите название статьи');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      toast.error('Введите содержание статьи');
      return;
    }
    if (!formData.section_id || !formData.section_id.trim()) {
      toast.error('Введите ID секции');
      return;
    }

    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        section_id: formData.section_id.trim(),
        tags: formData.tags?.trim() || null,
      };

      await adminAPI.handbook.updateArticle(editingArticle.id, updateData);
      toast.success('Статья успешно обновлена');
      fetchArticles();
      setEditingArticle(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении статьи');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить статью?')) return;

    try {
      await adminAPI.handbook.deleteArticle(id);
      toast.success('Статья успешно удалена');
      fetchArticles();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении статьи');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      section_id: 'section-1',
      title: '',
      content: '',
      tags: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Управление Handbook</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2" size={20} />
          Создать статью
        </Button>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.length === 0 ? (
          <Card className="p-12 bg-gray-900 border-gray-800 border-2 border-dashed">
            <div className="text-center">
              <p className="text-gray-300 text-lg mb-2">Статьи не найдены</p>
              <p className="text-gray-300 text-sm mb-4">Создайте первую статью справочника</p>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2" size={18} />
                Создать статью
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Card key={article.id} className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="text-blue-500" size={20} />
                          <h3 className="text-xl font-bold text-white">{article.title}</h3>
                        </div>
                        <p className="text-gray-300 text-xs mb-2">Секция: {article.section_id}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:text-blue-400 hover:bg-gray-800"
                          onClick={() => {
                            setEditingArticle(article);
                            setFormData({
                              id: article.id,
                              section_id: article.section_id,
                              title: article.title,
                              content: article.content,
                              tags: article.tags || '',
                            });
                            setIsEditDialogOpen(true);
                          }}
                          title="Редактировать"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:text-red-400 hover:bg-gray-800"
                          onClick={() => handleDelete(article.id)}
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{article.content}</p>
                    {article.tags && (() => {
                      try {
                        const tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags;
                        return Array.isArray(tags) && tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-gray-800 text-gray-200 text-xs rounded-full border border-gray-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Article Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать новую статью</DialogTitle>
            <DialogDescription className="text-gray-300">
              Заполните форму для создания новой статьи справочника
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID статьи *</Label>
              <Input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="article-react-hooks"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
              <p className="text-gray-300 text-xs mt-1">Уникальный идентификатор статьи</p>
            </div>
            <div>
              <Label className="text-gray-200">ID секции *</Label>
              <Input
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                placeholder="section-1"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="React Hooks"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-200">Содержание (Markdown) *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="# React Hooks\n\nHooks позволяют использовать состояние и другие возможности React..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300 font-mono text-sm"
                rows={10}
              />
              <p className="text-gray-300 text-xs mt-1">Поддерживается Markdown форматирование</p>
            </div>
            <div>
              <Label className="text-gray-200">Теги (опционально)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder='["react", "hooks", "frontend"] или через запятую'
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
              <p className="text-gray-300 text-xs mt-1">JSON массив или список через запятую</p>
            </div>
            <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2">
              Создать статью
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать статью</DialogTitle>
            <DialogDescription className="text-gray-300">
              Измените данные статьи. ID статьи нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-200">ID статьи</Label>
              <Input
                value={formData.id}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-300 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-200">ID секции *</Label>
              <Input
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                placeholder="section-1"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-200">Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="React Hooks"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-200">Содержание (Markdown) *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="# React Hooks\n\nHooks позволяют использовать состояние и другие возможности React..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300 font-mono text-sm"
                rows={10}
              />
            </div>
            <div>
              <Label className="text-gray-200">Теги</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder='["react", "hooks", "frontend"]'
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-300"
              />
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
