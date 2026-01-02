import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Edit, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { adminAPI } from '@/api/adminClient';
import { useApiQuery, useApiMutation } from '../hooks';
import { LoadingState, ErrorState, EmptyState, ConfirmDialog, SearchBar, FormField } from '../components';
import { useFormValidation } from '../hooks';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });

  // Загрузка пользователей
  const { data: usersData, loading, error, refetch } = useApiQuery(
    () => adminAPI.users.getAll(),
    { cacheTime: 5 * 60 * 1000 }
  );

  const users = Array.isArray(usersData) ? usersData : [];

  // Фильтрация
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Форма с валидацией
  const formValidation = useFormValidation(
    {
    username: '',
    email: '',
    role: 'student',
    is_active: true,
    },
    {
      rules: {
        username: {
          required: true,
          minLength: 3,
          maxLength: 50,
        },
        email: {
          required: true,
          email: true,
        },
      },
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  const formData = formValidation.data;
  const { setFieldValue, handleBlur, validate, errors, reset: resetForm } = formValidation;

  // Мутации
  const updateMutation = useApiMutation(
    (data: { id: string; data: any }) => adminAPI.users.update(data.id, data.data),
    {
      invalidateQueries: ['users'],
      successMessage: 'Пользователь успешно обновлен',
      onSuccess: () => {
        refetch();
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => adminAPI.users.delete(id),
    {
      invalidateQueries: ['users'],
      successMessage: 'Пользователь успешно удален',
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Обработчики
  const handleUpdate = async () => {
    if (!editingUser) return;
    if (!validate()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };

    await updateMutation.mutate({ id: editingUser.id, data: updateData });
    setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
  };

  const handleDelete = async () => {
    if (!deleteConfirm.userId) return;
    await deleteMutation.mutate(deleteConfirm.userId);
    setDeleteConfirm({ open: false, userId: null });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    resetForm({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <LoadingState message="Загрузка пользователей..." />;
  }

  if (error) {
    return <ErrorState error={error} title="Ошибка загрузки пользователей" onRetry={refetch} />;
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
    <div>
          <h1 className="text-3xl font-bold text-white mb-2">Управление пользователями</h1>
          <p className="text-gray-300 text-sm">
            Управление пользователями платформы
          </p>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
            placeholder="Поиск по имени или email..."
              onSearch={setSearchQuery}
          />
        </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
            >
              <option value="all">Все роли</option>
              <option value="student">Студент</option>
              <option value="curator">Куратор</option>
              <option value="admin">Администратор</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
      </div>
        <div className="mt-3 text-sm text-gray-300">
          Найдено пользователей: {filteredUsers.length} из {users.length}
            </div>
          </Card>

      {/* Список пользователей */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Пользователи не найдены"
          description={
            searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска или фильтры'
              : 'Нет пользователей в системе'
          }
        />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user: User) => (
            <Card key={user.id} className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{user.username}</h3>
                  <p className="text-gray-300 text-sm mb-2">{user.email}</p>
                  <div className="flex gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'admin'
                          ? 'border-red-600/30 text-red-400'
                          : user.role === 'curator'
                          ? 'border-blue-600/30 text-blue-400'
                          : 'border-green-600/30 text-green-400'
                      }
                    >
                      {user.role === 'admin' ? 'Админ' : user.role === 'curator' ? 'Куратор' : 'Студент'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        user.is_active
                          ? 'border-green-600/30 text-green-400'
                          : 'border-gray-600/30 text-gray-400'
                      }
                    >
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                        </div>
                        {user.created_at && (
                    <p className="text-gray-400 text-xs">
                      Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                        <Button
                          onClick={() => openEditDialog(user)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                  <Edit className="mr-1" size={14} />
                  Редактировать
                        </Button>
                        <Button
                  onClick={() => setDeleteConfirm({ open: true, userId: user.id })}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription className="text-gray-300">
              Измените данные пользователя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <FormField
              type="input"
              label="Имя пользователя"
                value={formData.username}
              onChange={(value) => setFieldValue('username', value)}
              onBlur={() => handleBlur('username')}
              error={errors.username}
              required
            />

            <FormField
              type="input"
              label="Email"
                value={formData.email}
              onChange={(value) => setFieldValue('email', value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              required
              inputType="email"
            />

            <FormField
              type="select"
              label="Роль"
              value={formData.role}
              onChange={(value) => setFieldValue('role', value)}
              options={[
                { value: 'student', label: 'Студент' },
                { value: 'curator', label: 'Куратор' },
                { value: 'admin', label: 'Администратор' },
              ]}
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFieldValue('is_active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-200 cursor-pointer">
                Активен
              </label>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, userId: deleteConfirm.userId })}
        title="Удалить пользователя?"
        description="Это действие нельзя отменить. Все данные пользователя будут удалены."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
