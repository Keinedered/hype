import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/api/adminClient';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'student',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const data = await adminAPI.users.getAll();
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray);
      setFilteredUsers(usersArray);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error(error.message || 'Ошибка загрузки пользователей');
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    // Валидация
    if (!formData.username || !formData.username.trim()) {
      toast.error('Введите имя пользователя');
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      toast.error('Введите email');
      return;
    }
    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Введите корректный email адрес');
      return;
    }

    try {
      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };

      await adminAPI.users.update(editingUser.id, updateData);
      toast.success('Пользователь успешно обновлен');
      fetchUsers();
      setEditingUser(null);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении пользователя');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить пользователя?')) return;

    try {
      await adminAPI.users.delete(id);
      toast.success('Пользователь успешно удален');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении пользователя');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: 'student',
      is_active: true,
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600';
      case 'teacher':
        return 'bg-blue-600';
      case 'student':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="bg-gray-900 border-gray-800 pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="p-12 bg-gray-900 border-gray-800 border-2 border-dashed">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">
                {searchQuery ? 'Пользователи не найдены' : 'Пользователи не найдены'}
              </p>
              {searchQuery && (
                <p className="text-gray-500 text-sm">Попробуйте изменить поисковый запрос</p>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-white">{user.username}</h3>
                          <span className={`px-3 py-1 text-white text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {!user.is_active && (
                            <span className="px-3 py-1 bg-gray-700/50 text-gray-400 text-xs font-medium rounded-full border border-gray-600/30">
                              Неактивен
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 mb-2">{user.email}</p>
                        {user.created_at && (
                          <p className="text-gray-500 text-xs">
                            Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                          onClick={() => openEditDialog(user)}
                          title="Редактировать"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                          onClick={() => handleDelete(user.id)}
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription className="text-gray-400">
              Измените данные пользователя. ID пользователя нельзя изменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">ID пользователя</Label>
              <Input
                value={editingUser?.id || ''}
                disabled
                className="bg-gray-800/50 border-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-300">Имя пользователя *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-300">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Роль</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Статус</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

