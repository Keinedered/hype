import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { deleteAdminUser, getAdminUserDetails, getAdminUsers, resetAdminUserPassword } from '../api/admin';
import { AdminUserDetail, AdminUserListItem, ResetPasswordResponse } from '../types/admin';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
  return axiosError.response?.data?.detail || axiosError.response?.data?.message || fallback;
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoadingUserId, setDetailsLoadingUserId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<AdminUserDetail | null>(null);

  const [resetLoadingUserId, setResetLoadingUserId] = useState<string | null>(null);
  const [tempPasswordData, setTempPasswordData] = useState<ResetPasswordResponse | null>(null);
  const [tempPasswordOpen, setTempPasswordOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUserListItem | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteLoadingUserId, setDeleteLoadingUserId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setIsListLoading(true);
      setListError(null);
      try {
        const data = await getAdminUsers();
        setUsers(data);
      } catch (error) {
        setListError(getErrorMessage(error, 'Failed to load users list.'));
      } finally {
        setIsListLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.username.localeCompare(b.username)), [users]);

  const openDetails = async (userId: string) => {
    setActionError(null);
    setDetailsOpen(true);
    setDetailsLoadingUserId(userId);
    setSelectedDetails(null);

    try {
      const details = await getAdminUserDetails(userId);
      setSelectedDetails(details);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to load user details.'));
      setDetailsOpen(false);
    } finally {
      setDetailsLoadingUserId(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setActionError(null);
    setTempPasswordOpen(false);
    setTempPasswordData(null);
    setResetLoadingUserId(userId);

    try {
      const response = await resetAdminUserPassword(userId)
      setTempPasswordData(response);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to reset password.'));
    } finally {
      setResetLoadingUserId(null);
    }
  };

  const openDeleteDialog = (user: AdminUserListItem) => {
    setDeleteCandidate(user);
    setDeleteConfirmed(false);
    setDeleteDialogOpen(true);
    setActionError(null);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    setDeleteLoadingUserId(deleteCandidate.id);
    setActionError(null);

    try {
      await deleteAdminUser(deleteCandidate.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteCandidate.id));
      setDeleteDialogOpen(false);
      setDeleteCandidate(null);
      setDeleteConfirmed(false);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to delete user.'));
    } finally {
      setDeleteLoadingUserId(null);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mx-auto max-w-6xl border-2 border-black bg-white p-6 space-y-4">
        <h1 className="font-mono text-2xl uppercase tracking-wide">Admin Panel / Users</h1>
        <p className="font-mono text-sm text-muted-foreground">
          Manage users, inspect system fields, reset passwords, and remove accounts.
        </p>

        {tempPasswordData && (
          <div className="border-2 border-black bg-amber-50 p-3">
            <p className="font-mono text-xs mb-1">Temporary password for <strong>{tempPasswordData.username}</strong>:</p>
            <p className="font-mono text-lg tracking-wide break-all">{tempPasswordData.temporary_password}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-black rounded-none"
                onClick={async () => {
                  if (tempPasswordData?.temporary_password) {
                    await navigator.clipboard.writeText(tempPasswordData.temporary_password);
                  }
                }}
              >
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-2 border-black rounded-none"
                onClick={() => {
                  setTempPasswordOpen(false);
                  setTempPasswordData(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}        {actionError && (
          <div className="border-2 border-red-600 bg-red-50 p-3">
            <p className="font-mono text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {isListLoading ? (
          <p className="font-mono text-sm uppercase">Loading users...</p>
        ) : listError ? (
          <div className="border-2 border-red-600 bg-red-50 p-3">
            <p className="font-mono text-sm text-red-700">{listError}</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full min-w-[900px] font-mono text-sm">
              <thead className="bg-black text-white uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Last Login</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="border-t border-black/20">
                    <td className="px-3 py-2">{user.username}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2 uppercase">{user.role}</td>
                    <td className="px-3 py-2">{formatDate(user.created_at)}</td>
                    <td className="px-3 py-2">{formatDate(user.last_login_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                          disabled={detailsLoadingUserId === user.id}
                          onClick={() => void openDetails(user.id)}
                        >
                          {detailsLoadingUserId === user.id ? 'Loading...' : 'Details'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                          disabled={resetLoadingUserId === user.id}
                          onClick={() => void handleResetPassword(user.id)}
                        >
                          {resetLoadingUserId === user.id ? 'Reset...' : 'Reset Password'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none font-mono uppercase tracking-wide text-red-700"
                          disabled={deleteLoadingUserId === user.id}
                          onClick={() => openDeleteDialog(user)}
                        >
                          {deleteLoadingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedUsers.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="border-2 border-black rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">User Details</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              Full database-level user payload for admin diagnostics.
            </DialogDescription>
          </DialogHeader>

          {selectedDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div><strong>ID:</strong> {selectedDetails.id}</div>
              <div><strong>Username:</strong> {selectedDetails.username}</div>
              <div><strong>Email:</strong> {selectedDetails.email}</div>
              <div><strong>Role:</strong> {selectedDetails.role}</div>
              <div><strong>Active:</strong> {String(selectedDetails.is_active)}</div>
              <div><strong>Avatar:</strong> {selectedDetails.avatar_url ?? '-'}</div>
              <div><strong>Created:</strong> {formatDate(selectedDetails.created_at)}</div>
              <div><strong>Last login:</strong> {formatDate(selectedDetails.last_login_at)}</div>
              <div className="md:col-span-2"><strong>Hashed password:</strong> {selectedDetails.hashed_password}</div>
              <div><strong>Submissions:</strong> {selectedDetails.submissions_count}</div>
              <div><strong>Notifications:</strong> {selectedDetails.notifications_count}</div>
              <div><strong>User courses:</strong> {selectedDetails.user_courses_count}</div>
              <div><strong>User lessons:</strong> {selectedDetails.user_lessons_count}</div>
            </div>
          ) : (
            <p className="font-mono text-sm">Loading details...</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" className="border-2 border-black rounded-none" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tempPasswordOpen} onOpenChange={(open) => { setTempPasswordOpen(open); if (!open) { setTempPasswordData(null); } }}>
        <DialogContent className="border-2 border-black rounded-none">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">Temporary Password</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              Copy and transfer this password to the user securely.
            </DialogDescription>
          </DialogHeader>

          <div className="border-2 border-black p-3 bg-gray-50">
            <p className="font-mono text-xs mb-2">User: {tempPasswordData?.username}</p>
            <p className="font-mono text-lg tracking-wide break-all">{tempPasswordData?.temporary_password}</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black rounded-none"
              onClick={async () => {
                if (tempPasswordData?.temporary_password) {
                  await navigator.clipboard.writeText(tempPasswordData.temporary_password);
                }
              }}
            >
              Copy
            </Button>
            <Button type="button" className="border-2 border-black rounded-none" onClick={() => setTempPasswordData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-2 border-black rounded-none">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">Delete user?</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              This action is destructive and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 font-mono text-sm">
            <p>
              Target: <strong>{deleteCandidate?.username}</strong>
            </p>
            <label className="flex items-center gap-2 text-xs uppercase tracking-wide">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
              />
              I am sure
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-2 border-black rounded-none" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="border-2 border-black rounded-none bg-red-100 text-black hover:bg-red-200"
              disabled={!deleteConfirmed || deleteLoadingUserId === deleteCandidate?.id}
              onClick={() => void confirmDelete()}
            >
              {deleteLoadingUserId === deleteCandidate?.id ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



