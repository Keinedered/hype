import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AxiosError } from 'axios';
import {
  createAdminCourse,
  createAdminLesson,
  createAdminModule,
  createAdminTrack,
  deleteAdminCourse,
  deleteAdminLesson,
  deleteAdminLessonVideo,
  deleteAdminModule,
  deleteAdminTrack,
  deleteAdminUser,
  getAdminCourse,
  getAdminCourses,
  getAdminLesson,
  getAdminLessons,
  getAdminModule,
  getAdminModules,
  getAdminSubmissions,
  getAdminTracks,
  getAdminUserDetails,
  getAdminUsers,
  updateAdminUser,
  reviewAdminSubmission,
  resetAdminUserPassword,
  uploadAdminLessonVideo,
  updateAdminCourse,
  updateAdminLesson,
  updateAdminModule,
  updateAdminTrack,
} from '../api/admin';
import { tracksAPI } from '../api/client';
import { normalizeTrack, RawTrack } from '../api/normalizers';
import { toAbsolutePublicUrl } from '../api/urls';
import {
  AdminCourseDetail,
  AdminCourseListItem,
  AdminLessonDetail,
  AdminLessonListItem,
  AdminModuleDetail,
  AdminModuleListItem,
  AdminSubmissionListItem,
  AdminTrackDetail,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserUpdate,
  ResetPasswordResponse,
} from '../types/admin';
import { Track } from '../types';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

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

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

type CourseFormState = {
  id: string;
  trackId: Track['id'] | '';
  title: string;
  version: string;
  description: string;
  shortDescription: string;
  level: AdminCourseDetail['level'];
  taskCount: number;
  enrollmentDeadline: string;
  authorsText: string;
};

type ModuleFormState = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
};

type AssignmentFormState = {
  enabled: boolean;
  existing: boolean;
  id: string;
  description: string;
  criteria: string;
  requiresText: boolean;
  requiresFile: boolean;
  requiresLink: boolean;
  requiresAny: boolean;
};

type LessonFormState = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration: string;
  content: string;
  orderIndex: number;
  assignment: AssignmentFormState;
};

type TrackFormState = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const emptyCourseForm = (): CourseFormState => ({
  id: '',
  trackId: '',
  title: '',
  version: 'v1.0',
  description: '',
  shortDescription: '',
  level: 'beginner',
  taskCount: 0,
  enrollmentDeadline: '',
  authorsText: '',
});

const emptyModuleForm = (courseId: string): ModuleFormState => ({
  id: '',
  courseId,
  title: '',
  description: '',
  orderIndex: 0,
});

const emptyLessonForm = (moduleId: string): LessonFormState => ({
  id: '',
  moduleId,
  title: '',
  description: '',
  videoUrl: '',
  videoDuration: '',
  content: '',
  orderIndex: 0,
  assignment: {
    enabled: false,
    existing: false,
    id: '',
    description: '',
    criteria: '',
    requiresText: false,
    requiresFile: false,
    requiresLink: false,
    requiresAny: false,
  },
});

const emptyTrackForm = (): TrackFormState => ({
  id: '',
  name: '',
  description: '',
  color: '',
});


export function AdminPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoadingUserId, setDetailsLoadingUserId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<AdminUserDetail | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [userEditForm, setUserEditForm] = useState<AdminUserUpdate | null>(null);
  const [userEditLoading, setUserEditLoading] = useState(false);

  const [resetLoadingUserId, setResetLoadingUserId] = useState<string | null>(null);
  const [tempPasswordData, setTempPasswordData] = useState<ResetPasswordResponse | null>(null);
  const [tempPasswordOpen, setTempPasswordOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUserListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteLoadingUserId, setDeleteLoadingUserId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [adminTracks, setAdminTracks] = useState<AdminTrackDetail[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState<TrackFormState>(emptyTrackForm());

  const [tracks, setTracks] = useState<Track[]>([]);
  const [courses, setCourses] = useState<AdminCourseListItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [, setSelectedCourse] = useState<AdminCourseDetail | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm());

  const [modules, setModules] = useState<AdminModuleListItem[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [, setSelectedModule] = useState<AdminModuleDetail | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm(''));

  const [lessons, setLessons] = useState<AdminLessonListItem[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [, setSelectedLesson] = useState<AdminLessonDetail | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm(''));
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadMessage, setVideoUploadMessage] = useState<string | null>(null);

  const [contentMessage, setContentMessage] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<AdminSubmissionListItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);

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

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const rawTracks = (await tracksAPI.getAll()) as RawTrack[];
        setTracks(rawTracks.map(normalizeTrack));
      } catch {
        setTracks([]);
      }
    };

    void loadTracks();
  }, []);

  useEffect(() => {
    const loadAdminTracks = async () => {
      setTracksLoading(true);
      setTracksError(null);
      try {
        const data = await getAdminTracks();
        setAdminTracks(data);
      } catch (error) {
        setTracksError(getErrorMessage(error, 'Не удалось загрузить треки.'));
      } finally {
        setTracksLoading(false);
      }
    };

    void loadAdminTracks();
  }, []);

  useEffect(() => {
    const loadSubmissions = async () => {
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      try {
        const data = await getAdminSubmissions();
        setSubmissions(data);
      } catch (error) {
        setSubmissionsError(getErrorMessage(error, 'Не удалось загрузить задания.'));
      } finally {
        setSubmissionsLoading(false);
      }
    };

    void loadSubmissions();
  }, []);

  useEffect(() => {
    if (!selectedTrackId) {
      setTrackForm(emptyTrackForm());
      return;
    }
    const selected = adminTracks.find((track) => track.id === selectedTrackId);
    if (!selected) {
      setTrackForm(emptyTrackForm());
      return;
    }
    setTrackForm({
      id: selected.id,
      name: selected.name ?? '',
      description: selected.description ?? '',
      color: selected.color ?? '',
    });
  }, [selectedTrackId, adminTracks]);

  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const data = await getAdminCourses();
        setCourses(data);
      } catch (error) {
        setCoursesError(getErrorMessage(error, 'Не удалось загрузить курсы.'));
      } finally {
        setCoursesLoading(false);
      }
    };

    void loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourse(null);
      setModules([]);
      setLessons([]);
      setSelectedModuleId(null);
      setSelectedLessonId(null);
      setModuleForm(emptyModuleForm(''));
      setLessonForm(emptyLessonForm(''));
      return;
    }

    const loadCourse = async () => {
      setCoursesError(null);
      try {
        const data = await getAdminCourse(selectedCourseId);
        setSelectedCourse(data);
        setCourseForm({
          id: data.id,
          trackId: data.track_id,
          title: data.title ?? '',
          version: data.version ?? '',
          description: data.description ?? '',
          shortDescription: data.short_description ?? '',
          level: data.level,
          taskCount: data.task_count,
          enrollmentDeadline: data.enrollment_deadline ?? '',
          authorsText: data.authors.join(', '),
        });
      } catch (error) {
        setCoursesError(getErrorMessage(error, 'Не удалось загрузить курс.'));
      }
    };

    const loadModules = async () => {
      setModulesLoading(true);
      setModulesError(null);
      try {
        const data = await getAdminModules(selectedCourseId);
        setModules(data);
      } catch (error) {
        setModulesError(getErrorMessage(error, 'Не удалось загрузить модули.'));
      } finally {
        setModulesLoading(false);
      }
    };

    void loadCourse();
    void loadModules();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedModule(null);
      setLessons([]);
      setSelectedLessonId(null);
      setLessonForm(emptyLessonForm(''));
      return;
    }

    const loadModule = async () => {
      setModulesError(null);
      try {
        const data = await getAdminModule(selectedModuleId);
        setSelectedModule(data);
        setModuleForm({
          id: data.id,
          courseId: data.course_id,
          title: data.title ?? '',
          description: data.description ?? '',
          orderIndex: data.order_index,
        });
      } catch (error) {
        setModulesError(getErrorMessage(error, 'Не удалось загрузить модуль.'));
      }
    };

    const loadLessons = async () => {
      setLessonsLoading(true);
      setLessonsError(null);
      try {
        const data = await getAdminLessons(selectedModuleId);
        setLessons(data);
      } catch (error) {
        setLessonsError(getErrorMessage(error, 'Не удалось загрузить уроки.'));
      } finally {
        setLessonsLoading(false);
      }
    };

    void loadModule();
    void loadLessons();
  }, [selectedModuleId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setSelectedLesson(null);
      setVideoUploadMessage(null);
      return;
    }

    const loadLesson = async () => {
      setLessonsError(null);
      setVideoUploadMessage(null);
      try {
        const data = await getAdminLesson(selectedLessonId);
        setSelectedLesson(data);
        setLessonForm({
          id: data.id,
          moduleId: data.module_id,
          title: data.title ?? '',
          description: data.description ?? '',
          videoUrl: data.video_url ?? '',
          videoDuration: data.video_duration ?? '',
          content: data.content ?? '',
          orderIndex: data.order_index,
          assignment: data.assignment
            ? {
                enabled: true,
                existing: true,
                id: data.assignment.id,
                description: data.assignment.description ?? '',
                criteria: data.assignment.criteria ?? '',
                requiresText: data.assignment.requires_text,
                requiresFile: data.assignment.requires_file,
                requiresLink: data.assignment.requires_link,
                requiresAny: data.assignment.requires_any,
              }
            : {
                enabled: false,
                existing: false,
                id: data.id ? `${data.id}-assignment` : '',
                description: '',
                criteria: '',
                requiresText: false,
                requiresFile: false,
                requiresLink: false,
                requiresAny: false,
              },
        });
      } catch (error) {
        setLessonsError(getErrorMessage(error, 'Не удалось загрузить урок.'));
      }
    };

    void loadLesson();
  }, [selectedLessonId]);

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.username.localeCompare(b.username)), [users]);

  const openDetails = async (userId: string) => {
    setActionError(null);
    setDetailsError(null);
    setDetailsOpen(true);
    setDetailsLoadingUserId(userId);
    setSelectedDetails(null);

    try {
      const details = await getAdminUserDetails(userId);
      setSelectedDetails(details);
      setUserEditForm({
        email: details.email,
        username: details.username,
        full_name: details.full_name ?? '',
        role: details.role,
        is_active: details.is_active,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load user details.');
      setDetailsError(message);
      setActionError(message);
    } finally {
      setDetailsLoadingUserId(null);
    }
  };

  const handleUserUpdate = async () => {
    if (!selectedDetails || !userEditForm) {
      return;
    }
    setUserEditLoading(true);
    setActionError(null);
    try {
      const updated = await updateAdminUser(selectedDetails.id, {
        email: userEditForm.email?.trim() || null,
        username: userEditForm.username?.trim() || null,
        full_name: userEditForm.full_name?.trim() || null,
        role: userEditForm.role,
        is_active: userEditForm.is_active,
      });
      setSelectedDetails(updated);
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? { ...user, username: updated.username, email: updated.email, role: updated.role, is_active: updated.is_active } : user)));
      setContentMessage(`Пользователь "${updated.username}" обновлен.`);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to update user.'));
    } finally {
      setUserEditLoading(false);
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
      const message = getErrorMessage(error, 'Failed to delete user.');
      setDeleteError(message);
      setActionError(message);
    } finally {
      setDeleteLoadingUserId(null);
    }
  };

  const trackOptions = useMemo(() => tracks, [tracks]);

  const applyCourseSelection = (course: AdminCourseListItem) => {
    setSelectedCourseId(course.id);
    setSelectedModuleId(null);
    setSelectedLessonId(null);
    setModuleForm(emptyModuleForm(course.id));
    setLessonForm(emptyLessonForm(''));
  };

  const refreshTracks = async () => {
    try {
      const adminData = await getAdminTracks();
      setAdminTracks(adminData);
    } catch {
      // handled by callers
    }

    try {
      const rawTracks = (await tracksAPI.getAll()) as RawTrack[];
      setTracks(rawTracks.map(normalizeTrack));
    } catch {
      setTracks([]);
    }
  };

  const handleTrackCreate = async () => {
    setTracksError(null);
    setContentMessage(null);
    if (!trackForm.id) {
      setTracksError('Выберите ID трека.');
      return;
    }
    if (!trackForm.name.trim()) {
      setTracksError('Укажите название трека.');
      return;
    }
    if (!trackForm.color.trim()) {
      setTracksError('Укажите цвет трека.');
      return;
    }
    try {
      const created = await createAdminTrack({
        id: trackForm.id.trim() as AdminTrackDetail['id'],
        name: trackForm.name.trim(),
        description: emptyToNull(trackForm.description),
        color: trackForm.color.trim(),
      });
      setContentMessage(`Трек "${created.name}" создан.`);
      await refreshTracks();
      setSelectedTrackId(created.id);
    } catch (error) {
      setTracksError(getErrorMessage(error, 'Не удалось создать трек.'));
    }
  };

  const handleTrackUpdate = async () => {
    if (!selectedTrackId) {
      setTracksError('Выберите трек для обновления.');
      return;
    }
    setTracksError(null);
    setContentMessage(null);
    if (!trackForm.color.trim()) {
      setTracksError('Укажите цвет трека.');
      return;
    }
    try {
      const updated = await updateAdminTrack(selectedTrackId, {
        name: trackForm.name.trim(),
        description: emptyToNull(trackForm.description),
        color: trackForm.color.trim(),
      });
      setContentMessage(`Трек "${updated.name}" обновлен.`);
      await refreshTracks();
    } catch (error) {
      setTracksError(getErrorMessage(error, 'Не удалось обновить трек.'));
    }
  };

  const handleTrackDelete = async (trackId: string) => {
    if (!window.confirm('Удалить трек? Это возможно только если у трека нет курсов.')) {
      return;
    }
    setTracksError(null);
    setContentMessage(null);
    try {
      await deleteAdminTrack(trackId);
      await refreshTracks();
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null);
        setTrackForm(emptyTrackForm());
      }
      setContentMessage('Трек удален.');
    } catch (error) {
      setTracksError(getErrorMessage(error, 'Не удалось удалить трек.'));
    }
  };

  const handleCourseCreate = async () => {
    setContentMessage(null);
    setCoursesError(null);
    if (!courseForm.id.trim()) {
      setCoursesError('Укажите ID курса.');
      return;
    }
    if (!courseForm.title.trim()) {
      setCoursesError('Укажите название курса.');
      return;
    }
    if (!courseForm.trackId) {
      setCoursesError('Выберите трек.');
      return;
    }

    try {
      const created = await createAdminCourse({
        id: courseForm.id.trim(),
        track_id: courseForm.trackId,
        title: courseForm.title.trim(),
        version: emptyToNull(courseForm.version) ?? 'v1.0',
        description: emptyToNull(courseForm.description),
        short_description: emptyToNull(courseForm.shortDescription),
        level: courseForm.level,
        task_count: Number(courseForm.taskCount) || 0,
        enrollment_deadline: courseForm.enrollmentDeadline.trim() || null,
        authors: courseForm.authorsText
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setContentMessage(`Курс "${created.title}" создан.`);
      const updated = await getAdminCourses();
      setCourses(updated);
      applyCourseSelection(created);
    } catch (error) {
      setCoursesError(getErrorMessage(error, 'Не удалось создать курс.'));
    }
  };

  const handleCourseUpdate = async () => {
    if (!selectedCourseId) {
      setCoursesError('Выберите курс для обновления.');
      return;
    }
    setContentMessage(null);
    setCoursesError(null);

    try {
      const cleanedAuthors = courseForm.authorsText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const updated = await updateAdminCourse(selectedCourseId, {
        track_id: courseForm.trackId || undefined,
        title: courseForm.title.trim(),
        version: emptyToNull(courseForm.version),
        description: emptyToNull(courseForm.description),
        short_description: emptyToNull(courseForm.shortDescription),
        level: courseForm.level,
        task_count: Number(courseForm.taskCount) || 0,
        enrollment_deadline: emptyToNull(courseForm.enrollmentDeadline),
        authors: cleanedAuthors,
      });
      setContentMessage(`Курс "${updated.title}" обновлен.`);
      const updatedList = await getAdminCourses();
      setCourses(updatedList);
    } catch (error) {
      setCoursesError(getErrorMessage(error, 'Не удалось обновить курс.'));
    }
  };

  const handleCourseDelete = async (courseId: string) => {
    setContentMessage(null);
    if (!window.confirm('Удалить курс? Все модули и уроки будут удалены.')) {
      return;
    }
    try {
      await deleteAdminCourse(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
        setCourseForm(emptyCourseForm());
      }
      setContentMessage('Курс удален.');
    } catch (error) {
      setCoursesError(getErrorMessage(error, 'Не удалось удалить курс.'));
    }
  };

  const handleModuleCreate = async () => {
    if (!selectedCourseId) {
      setModulesError('Сначала выберите курс.');
      return;
    }
    if (!moduleForm.id.trim()) {
      setModulesError('Укажите ID модуля.');
      return;
    }
    if (!moduleForm.title.trim()) {
      setModulesError('Укажите название модуля.');
      return;
    }
    setModulesError(null);
    setContentMessage(null);

    try {
      const created = await createAdminModule({
        id: moduleForm.id.trim(),
        course_id: selectedCourseId,
        title: moduleForm.title.trim(),
        description: emptyToNull(moduleForm.description),
        order_index: Number(moduleForm.orderIndex) || 0,
      });
      setModules(await getAdminModules(selectedCourseId));
      setSelectedModuleId(created.id);
      setContentMessage('Модуль создан.');
    } catch (error) {
      setModulesError(getErrorMessage(error, 'Не удалось создать модуль.'));
    }
  };

  const handleModuleUpdate = async () => {
    if (!selectedModuleId) {
      setModulesError('Выберите модуль для обновления.');
      return;
    }
    setModulesError(null);
    setContentMessage(null);

    try {
      const courseId = moduleForm.courseId.trim();
      await updateAdminModule(selectedModuleId, {
        course_id: courseId.length > 0 ? courseId : undefined,
        title: moduleForm.title.trim(),
        description: emptyToNull(moduleForm.description),
        order_index: Number(moduleForm.orderIndex) || 0,
      });
      if (selectedCourseId) {
        setModules(await getAdminModules(selectedCourseId));
      }
      setContentMessage('Модуль обновлен.');
    } catch (error) {
      setModulesError(getErrorMessage(error, 'Не удалось обновить модуль.'));
    }
  };

  const handleModuleDelete = async (moduleId: string) => {
    if (!window.confirm('Удалить модуль? Все уроки модуля будут удалены.')) {
      return;
    }
    try {
      await deleteAdminModule(moduleId);
      if (selectedCourseId) {
        setModules(await getAdminModules(selectedCourseId));
      }
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
        setModuleForm(emptyModuleForm(selectedCourseId ?? ''));
      }
      setContentMessage('Модуль удален.');
    } catch (error) {
      setModulesError(getErrorMessage(error, 'Не удалось удалить модуль.'));
    }
  };

  const handleLessonCreate = async () => {
    if (!selectedModuleId) {
      setLessonsError('Сначала выберите модуль.');
      return;
    }
    if (!lessonForm.id.trim()) {
      setLessonsError('Укажите ID урока.');
      return;
    }
    if (!lessonForm.title.trim()) {
      setLessonsError('Укажите название урока.');
      return;
    }
    setLessonsError(null);
    setContentMessage(null);

    try {
      const assignmentPayload = lessonForm.assignment.enabled
        ? {
            id: lessonForm.assignment.id.trim() || `${lessonForm.id.trim()}-assignment`,
            description: lessonForm.assignment.description.trim(),
            criteria: lessonForm.assignment.criteria.trim(),
            requires_text: lessonForm.assignment.requiresText,
            requires_file: lessonForm.assignment.requiresFile,
            requires_link: lessonForm.assignment.requiresLink,
            requires_any: lessonForm.assignment.requiresAny,
          }
        : undefined;
      const created = await createAdminLesson({
        id: lessonForm.id.trim(),
        module_id: selectedModuleId,
        title: lessonForm.title.trim(),
        description: emptyToNull(lessonForm.description),
        video_url: lessonForm.videoUrl.trim() || null,
        video_duration: lessonForm.videoDuration.trim() || null,
        content: emptyToNull(lessonForm.content),
        order_index: Number(lessonForm.orderIndex) || 0,
        assignment: assignmentPayload,
      });
      setLessons(await getAdminLessons(selectedModuleId));
      setSelectedLessonId(created.id);
      setContentMessage('Урок создан.');
    } catch (error) {
      setLessonsError(getErrorMessage(error, 'Не удалось создать урок.'));
    }
  };

  const handleLessonUpdate = async () => {
    if (!selectedLessonId) {
      setLessonsError('Выберите урок для обновления.');
      return;
    }
    setLessonsError(null);
    setContentMessage(null);

    try {
      const moduleId = lessonForm.moduleId.trim();
      const assignmentPayload = lessonForm.assignment.enabled
        ? {
            id: lessonForm.assignment.id.trim() || `${lessonForm.id.trim()}-assignment`,
            description: lessonForm.assignment.description.trim(),
            criteria: lessonForm.assignment.criteria.trim(),
            requires_text: lessonForm.assignment.requiresText,
            requires_file: lessonForm.assignment.requiresFile,
            requires_link: lessonForm.assignment.requiresLink,
            requires_any: lessonForm.assignment.requiresAny,
          }
        : null;
      await updateAdminLesson(selectedLessonId, {
        module_id: moduleId.length > 0 ? moduleId : undefined,
        title: lessonForm.title.trim(),
        description: emptyToNull(lessonForm.description),
        video_url: emptyToNull(lessonForm.videoUrl),
        video_duration: emptyToNull(lessonForm.videoDuration),
        content: emptyToNull(lessonForm.content),
        order_index: Number(lessonForm.orderIndex) || 0,
        assignment: assignmentPayload,
      });
      if (selectedModuleId) {
        setLessons(await getAdminLessons(selectedModuleId));
      }
      setContentMessage('Урок обновлен.');
    } catch (error) {
      setLessonsError(getErrorMessage(error, 'Не удалось обновить урок.'));
    }
  };

  const handleLessonVideoUpload = async (file: File) => {
    if (!selectedLessonId) {
      setLessonsError('Сначала выберите урок.');
      return;
    }

    setVideoUploading(true);
    setVideoUploadMessage(null);
    setLessonsError(null);

    try {
      const updated = await uploadAdminLessonVideo(selectedLessonId, file);
      setLessonForm((prev) => ({
        ...prev,
        videoUrl: updated.video_url ?? '',
      }));
      setVideoUploadMessage('Видео загружено.');
    } catch (error) {
      setVideoUploadMessage(getErrorMessage(error, 'Не удалось загрузить видео.'));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleLessonVideoDelete = async () => {
    if (!selectedLessonId) {
      setLessonsError('Сначала выберите урок.');
      return;
    }

    setVideoUploading(true);
    setVideoUploadMessage(null);
    setLessonsError(null);

    try {
      const updated = await deleteAdminLessonVideo(selectedLessonId);
      setLessonForm((prev) => ({
        ...prev,
        videoUrl: updated.video_url ?? '',
      }));
      setVideoUploadMessage('Видео удалено.');
    } catch (error) {
      setVideoUploadMessage(getErrorMessage(error, 'Не удалось удалить видео.'));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleLessonDelete = async (lessonId: string) => {
    if (!window.confirm('Удалить урок?')) {
      return;
    }
    try {
      await deleteAdminLesson(lessonId);
      if (selectedModuleId) {
        setLessons(await getAdminLessons(selectedModuleId));
      }
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setLessonForm(emptyLessonForm(selectedModuleId ?? ''));
      }
      setContentMessage('Урок удален.');
    } catch (error) {
      setLessonsError(getErrorMessage(error, 'Не удалось удалить урок.'));
    }
  };

  const handleSubmissionReview = async (
    submission: AdminSubmissionListItem,
    status: 'accepted' | 'needs_revision'
  ) => {
    setSubmissionsError(null);
    setReviewingSubmissionId(submission.id);
    try {
      await reviewAdminSubmission(submission.id, {
        status,
        curator_comment: submissionNotes[submission.id] ?? submission.curator_comment ?? '',
      });
      const updated = await getAdminSubmissions();
      setSubmissions(updated);
    } catch (error) {
      setSubmissionsError(getErrorMessage(error, 'Не удалось обновить статус.'));
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mx-auto max-w-6xl border-2 border-black bg-white p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-mono text-2xl uppercase tracking-wide">Admin Panel</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Управляйте пользователями, курсами, модулями и уроками.
          </p>
        </div>

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
        )}
        {actionError && (
          <div className="border-2 border-red-600 bg-red-50 p-3">
            <p className="font-mono text-sm text-red-700">{actionError}</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="font-mono text-lg uppercase tracking-wide">Пользователи</h2>

          {detailsOpen && (
            <div className="border-2 border-black bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm uppercase tracking-wide">User details</p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none"
                  onClick={() => {
                    setDetailsOpen(false);
                    setSelectedDetails(null);
                    setDetailsError(null);
                    setUserEditForm(null);
                  }}
                >
                  Close
                </Button>
              </div>

              {detailsError ? (
                <p className="font-mono text-sm text-red-700">{detailsError}</p>
              ) : selectedDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                    <div><strong>ID:</strong> {selectedDetails.id}</div>
                    <div><strong>Avatar:</strong> {selectedDetails.avatar_url ?? '-'}</div>
                    <div><strong>Created:</strong> {formatDate(selectedDetails.created_at)}</div>
                    <div><strong>Last login:</strong> {formatDate(selectedDetails.last_login_at)}</div>
                    <div className="md:col-span-2"><strong>Hashed password:</strong> {selectedDetails.hashed_password}</div>
                    <div><strong>Submissions:</strong> {selectedDetails.submissions_count}</div>
                    <div><strong>Notifications:</strong> {selectedDetails.notifications_count}</div>
                    <div><strong>User courses:</strong> {selectedDetails.user_courses_count}</div>
                    <div><strong>User lessons:</strong> {selectedDetails.user_lessons_count}</div>
                  </div>

                  {userEditForm && (
                    <div className="border-2 border-black/40 p-3 space-y-3">
                      <div className="font-mono text-xs uppercase tracking-wide">Редактирование</div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-mono text-[10px] uppercase">Username</label>
                          <Input
                            value={userEditForm.username ?? ''}
                            onChange={(event) => setUserEditForm((prev) => prev ? { ...prev, username: event.target.value } : prev)}
                            className="rounded-none border-2 border-black font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-[10px] uppercase">Email</label>
                          <Input
                            value={userEditForm.email ?? ''}
                            onChange={(event) => setUserEditForm((prev) => prev ? { ...prev, email: event.target.value } : prev)}
                            className="rounded-none border-2 border-black font-mono"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-mono text-[10px] uppercase">Full name</label>
                          <Input
                            value={userEditForm.full_name ?? ''}
                            onChange={(event) => setUserEditForm((prev) => prev ? { ...prev, full_name: event.target.value } : prev)}
                            className="rounded-none border-2 border-black font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-[10px] uppercase">Role</label>
                          <select
                            value={userEditForm.role ?? 'user'}
                            onChange={(event) => setUserEditForm((prev) => prev ? { ...prev, role: event.target.value as AdminUserUpdate['role'] } : prev)}
                            className="h-9 w-full rounded-none border-2 border-black px-2 font-mono text-xs uppercase"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-[10px] uppercase">Active</label>
                          <div className="flex items-center gap-2 text-[10px] uppercase">
                            <input
                              type="checkbox"
                              checked={Boolean(userEditForm.is_active)}
                              onChange={(event) => setUserEditForm((prev) => prev ? { ...prev, is_active: event.target.checked } : prev)}
                            />
                            Активен
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                          disabled={userEditLoading}
                          onClick={handleUserUpdate}
                        >
                          {userEditLoading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-mono text-sm">Loading details...</p>
              )}
            </div>
          )}

          {deleteDialogOpen && deleteCandidate && (
            <div className="border-2 border-black bg-red-50 p-4 space-y-3">
              <p className="font-mono text-sm uppercase tracking-wide">Delete user?</p>
              <p className="font-mono text-sm">
                Target: <strong>{deleteCandidate.username}</strong>
              </p>
              {deleteError && (
                <p className="font-mono text-sm text-red-700">{deleteError}</p>
              )}
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(event) => setDeleteConfirmed(event.target.checked)}
                />
                I am sure
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteCandidate(null);
                    setDeleteConfirmed(false);
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="border-2 border-black rounded-none bg-red-100 text-black hover:bg-red-200"
                  disabled={!deleteConfirmed || deleteLoadingUserId === deleteCandidate.id}
                  onClick={() => void confirmDelete()}
                >
                  {deleteLoadingUserId === deleteCandidate.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
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
        </section>

        <section className="space-y-6 border-t-2 border-black pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-mono text-lg uppercase tracking-wide">Треки</h2>
              <p className="font-mono text-xs text-muted-foreground">Добавляйте и редактируйте треки (ID фиксированы).</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
              onClick={async () => {
                setTracksError(null);
                try {
                  const data = await getAdminTracks();
                  setAdminTracks(data);
                } catch (error) {
                  setTracksError(getErrorMessage(error, 'Не удалось обновить список треков.'));
                }
              }}
            >
              Обновить
            </Button>
          </div>

          {tracksError && (
            <div className="border-2 border-red-600 bg-red-50 p-3">
              <p className="font-mono text-sm text-red-700">{tracksError}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3 border-2 border-black p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm uppercase tracking-wide">Список треков</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none text-xs uppercase"
                  onClick={() => {
                    setSelectedTrackId(null);
                    setTrackForm(emptyTrackForm());
                  }}
                >
                  Новый
                </Button>
              </div>
              {tracksLoading ? (
                <p className="font-mono text-xs uppercase">Загрузка...</p>
              ) : (
                <div className="space-y-2">
                  {adminTracks.map((track) => (
                    <div
                      key={track.id}
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${selectedTrackId === track.id ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      <div className="font-mono text-sm uppercase tracking-wide">{track.name}</div>
                      <div className="font-mono text-xs opacity-70">{track.id}</div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none text-xs uppercase"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleTrackDelete(track.id);
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {adminTracks.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground">Треки не найдены.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 border-2 border-black p-4">
              <h3 className="font-mono text-sm uppercase tracking-wide">Параметры трека</h3>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID трека</label>
                  <Input
                    value={trackForm.id}
                    onChange={(event) => setTrackForm((prev) => ({ ...prev, id: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    placeholder="event"
                    disabled={Boolean(selectedTrackId)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Название</label>
                  <Input
                    value={trackForm.name}
                    onChange={(event) => setTrackForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Описание</label>
                  <Textarea
                    value={trackForm.description}
                    onChange={(event) => setTrackForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Цвет</label>
                  <Input
                    value={trackForm.color}
                    onChange={(event) => setTrackForm((prev) => ({ ...prev, color: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    placeholder="#E2B6C8"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedTrackId && (
                  <Button
                    type="button"
                    className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                    onClick={handleTrackCreate}
                  >
                    Создать трек
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                  onClick={handleTrackUpdate}
                  disabled={!selectedTrackId}
                >
                  Сохранить изменения
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t-2 border-black pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-mono text-lg uppercase tracking-wide">Курсы и контент</h2>
              <p className="font-mono text-xs text-muted-foreground">Создавайте курсы, модули и уроки прямо из админки.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
              onClick={async () => {
                setContentMessage(null);
                setCoursesError(null);
                try {
                  const updated = await getAdminCourses();
                  setCourses(updated);
                } catch (error) {
                  setCoursesError(getErrorMessage(error, 'Не удалось обновить список курсов.'));
                }
              }}
            >
              Обновить список
            </Button>
          </div>

          {contentMessage && (
            <div className="border-2 border-black bg-emerald-50 p-3">
              <p className="font-mono text-sm text-emerald-800">{contentMessage}</p>
            </div>
          )}

          {coursesError && (
            <div className="border-2 border-red-600 bg-red-50 p-3">
              <p className="font-mono text-sm text-red-700">{coursesError}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-3 border-2 border-black p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm uppercase tracking-wide">Курсы</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none text-xs uppercase"
                  onClick={() => {
                    setSelectedCourseId(null);
                    setCourseForm(emptyCourseForm());
                    setSelectedModuleId(null);
                    setSelectedLessonId(null);
                    setModuleForm(emptyModuleForm(''));
                    setLessonForm(emptyLessonForm(''));
                  }}
                >
                  Новый
                </Button>
              </div>

              {coursesLoading ? (
                <p className="font-mono text-xs uppercase">Загрузка...</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${selectedCourseId === course.id ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
                      onClick={() => applyCourseSelection(course)}
                    >
                      <div className="font-mono text-sm uppercase tracking-wide">{course.title}</div>
                      <div className="font-mono text-xs opacity-70">{course.id}</div>
                      <div className="font-mono text-[10px] uppercase opacity-60">Модулей: {course.module_count} · Уроков: {course.lesson_count}</div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground">Курсы не найдены.</p>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4 border-2 border-black p-4">
              <h3 className="font-mono text-sm uppercase tracking-wide">Параметры курса</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID курса</label>
                  <Input
                    value={courseForm.id}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, id: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    placeholder="course-id"
                    disabled={Boolean(selectedCourseId)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Трек</label>
                  <select
                    value={courseForm.trackId}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, trackId: event.target.value as Track['id'] }))}
                    className="w-full border-2 border-black rounded-none font-mono px-3 py-2"
                  >
                    <option value="">Выберите трек</option>
                    {trackOptions.map((track) => (
                      <option key={track.id} value={track.id}>{track.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Название</label>
                  <Input
                    value={courseForm.title}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Версия</label>
                  <Input
                    value={courseForm.version}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, version: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Уровень</label>
                  <select
                    value={courseForm.level}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, level: event.target.value as CourseFormState['level'] }))}
                    className="w-full border-2 border-black rounded-none font-mono px-3 py-2"
                  >
                    <option value="beginner">Начальный</option>
                    <option value="intermediate">Средний</option>
                    <option value="advanced">Продвинутый</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Задач</label>
                  <Input
                    type="number"
                    value={courseForm.taskCount}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, taskCount: Number(event.target.value) }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-mono text-xs uppercase">Короткое описание</label>
                  <Textarea
                    value={courseForm.shortDescription}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-mono text-xs uppercase">Описание</label>
                  <Textarea
                    value={courseForm.description}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Дедлайн набора</label>
                  <Input
                    value={courseForm.enrollmentDeadline}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, enrollmentDeadline: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Авторы (через запятую)</label>
                  <Input
                    value={courseForm.authorsText}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, authorsText: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!selectedCourseId && (
                  <Button
                    type="button"
                    className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                    onClick={handleCourseCreate}
                  >
                    Создать курс
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                  onClick={handleCourseUpdate}
                  disabled={!selectedCourseId}
                >
                  Сохранить изменения
                </Button>
                {selectedCourseId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-black rounded-none font-mono uppercase tracking-wide text-red-700"
                    onClick={() => handleCourseDelete(selectedCourseId)}
                  >
                    Удалить курс
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3 border-2 border-black p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm uppercase tracking-wide">Модули</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none text-xs uppercase"
                  onClick={() => {
                    if (!selectedCourseId) {
                      setModulesError('Сначала выберите курс.');
                      return;
                    }
                    setSelectedModuleId(null);
                    setModuleForm(emptyModuleForm(selectedCourseId));
                  }}
                >
                  Новый
                </Button>
              </div>
              {modulesError && (
                <p className="font-mono text-xs text-red-600">{modulesError}</p>
              )}
              {modulesLoading ? (
                <p className="font-mono text-xs uppercase">Загрузка...</p>
              ) : (
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${selectedModuleId === module.id ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
                      onClick={() => {
                        setSelectedModuleId(module.id);
                        setLessonForm(emptyLessonForm(module.id));
                      }}
                    >
                      <div className="font-mono text-sm uppercase tracking-wide">{module.title}</div>
                      <div className="font-mono text-xs opacity-70">{module.id}</div>
                      <div className="font-mono text-[10px] uppercase opacity-60">Уроков: {module.lesson_count}</div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none text-xs uppercase"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleModuleDelete(module.id);
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground">Модули не найдены.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 border-2 border-black p-4">
              <h3 className="font-mono text-sm uppercase tracking-wide">Параметры модуля</h3>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID модуля</label>
                  <Input
                    value={moduleForm.id}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, id: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    disabled={Boolean(selectedModuleId)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID курса</label>
                  <Input
                    value={moduleForm.courseId}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, courseId: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    disabled={!selectedModuleId}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Название</label>
                  <Input
                    value={moduleForm.title}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Описание</label>
                  <Textarea
                    value={moduleForm.description}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Порядок</label>
                  <Input
                    type="number"
                    value={moduleForm.orderIndex}
                    onChange={(event) => setModuleForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedModuleId && (
                  <Button
                    type="button"
                    className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                    onClick={handleModuleCreate}
                  >
                    Создать модуль
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                  onClick={handleModuleUpdate}
                  disabled={!selectedModuleId}
                >
                  Сохранить изменения
                </Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3 border-2 border-black p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm uppercase tracking-wide">Уроки</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none text-xs uppercase"
                  onClick={() => {
                    if (!selectedModuleId) {
                      setLessonsError('Сначала выберите модуль.');
                      return;
                    }
                    setSelectedLessonId(null);
                    setLessonForm(emptyLessonForm(selectedModuleId));
                  }}
                >
                  Новый
                </Button>
              </div>
              {lessonsError && (
                <p className="font-mono text-xs text-red-600">{lessonsError}</p>
              )}
              {lessonsLoading ? (
                <p className="font-mono text-xs uppercase">Загрузка...</p>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${selectedLessonId === lesson.id ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
                      onClick={() => setSelectedLessonId(lesson.id)}
                    >
                      <div className="font-mono text-sm uppercase tracking-wide">{lesson.title}</div>
                      <div className="font-mono text-xs opacity-70">{lesson.id}</div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-black rounded-none text-xs uppercase"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleLessonDelete(lesson.id);
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground">Уроки не найдены.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 border-2 border-black p-4">
              <h3 className="font-mono text-sm uppercase tracking-wide">Параметры урока</h3>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID урока</label>
                  <Input
                    value={lessonForm.id}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, id: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    disabled={Boolean(selectedLessonId)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">ID модуля</label>
                  <Input
                    value={lessonForm.moduleId}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, moduleId: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                    disabled={!selectedLessonId}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Название</label>
                  <Input
                    value={lessonForm.title}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Описание</label>
                  <Textarea
                    value={lessonForm.description}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase">Видео URL</label>
                    <Input
                      value={lessonForm.videoUrl}
                      onChange={(event) => setLessonForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                      className="rounded-none border-2 border-black font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-xs uppercase">Длительность</label>
                    <Input
                      value={lessonForm.videoDuration}
                      onChange={(event) => setLessonForm((prev) => ({ ...prev, videoDuration: event.target.value }))}
                      className="rounded-none border-2 border-black font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase">Загрузка видео</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      accept="video/*"
                      disabled={!selectedLessonId || videoUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleLessonVideoUpload(file);
                        }
                        event.target.value = '';
                      }}
                      className="rounded-none border-2 border-black font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-black rounded-none text-xs uppercase"
                      disabled={!lessonForm.videoUrl.trim() || videoUploading}
                      onClick={() => {
                        void handleLessonVideoDelete();
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                  <p className="font-mono text-[10px] uppercase text-gray-500">
                    {lessonForm.videoUrl.trim().length > 0
                      ? `Текущее видео: ${toAbsolutePublicUrl(lessonForm.videoUrl) ?? lessonForm.videoUrl}`
                      : 'Видео не загружено.'}
                  </p>
                  {videoUploadMessage && (
                    <p className="font-mono text-xs text-gray-600">{videoUploadMessage}</p>
                  )}
                  {lessonForm.videoUrl.trim().length > 0 && (
                    <div className="border-2 border-black bg-black/5 p-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                        Превью видео
                      </div>
                      <div className="aspect-video w-full border-2 border-black bg-black">
                        <video
                          key={lessonForm.videoUrl}
                          controls
                          className="w-full h-full"
                          src={toAbsolutePublicUrl(lessonForm.videoUrl) ?? lessonForm.videoUrl}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Контент (Markdown)</label>
                  <Textarea
                    value={lessonForm.content}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, content: event.target.value }))}
                    className="rounded-none border-2 border-black font-mono min-h-[160px]"
                  />
                  <div className="border-2 border-dashed border-black/30 bg-white/80 p-4 space-y-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Превью</div>
                    {lessonForm.content.trim().length === 0 ? (
                      <p className="text-sm text-gray-500">Введите markdown, чтобы увидеть превью.</p>
                    ) : (
                      <div className="max-w-none font-light text-gray-800 space-y-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: (props) => (
                              <h1 className="mt-10 mb-4 text-3xl md:text-4xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            h2: (props) => (
                              <h2 className="mt-8 mb-3 text-2xl md:text-3xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            h3: (props) => (
                              <h3 className="mt-6 mb-2 text-xl md:text-2xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            h4: (props) => (
                              <h4 className="mt-5 mb-2 text-lg md:text-xl font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            h5: (props) => (
                              <h5 className="mt-4 mb-2 text-base md:text-lg font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            h6: (props) => (
                              <h6 className="mt-4 mb-2 text-sm md:text-base font-bold font-mono uppercase tracking-wide text-black" {...props} />
                            ),
                            p: (props) => <p className="leading-relaxed" {...props} />,
                            ul: (props) => <ul className="list-disc pl-6 space-y-2" {...props} />,
                            ol: (props) => <ol className="list-decimal pl-6 space-y-2" {...props} />,
                            li: (props) => <li className="marker:text-black" {...props} />,
                          }}
                        >
                          {lessonForm.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3 border-2 border-black/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-mono text-xs uppercase tracking-wide">Задание</h4>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={lessonForm.assignment.enabled}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          setLessonForm((prev) => ({
                            ...prev,
                            assignment: {
                              ...prev.assignment,
                              enabled,
                              id: enabled && !prev.assignment.id && prev.id
                                ? `${prev.id}-assignment`
                                : prev.assignment.id,
                            },
                          }));
                        }}
                      />
                      Есть задание
                    </label>
                  </div>
                  {lessonForm.assignment.enabled && (
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <label className="font-mono text-xs uppercase">ID задания</label>
                        <Input
                          value={lessonForm.assignment.id}
                          onChange={(event) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              assignment: { ...prev.assignment, id: event.target.value },
                            }))
                          }
                          disabled={lessonForm.assignment.existing}
                          className="rounded-none border-2 border-black font-mono"
                        />
                        {lessonForm.assignment.existing && (
                          <p className="font-mono text-[10px] uppercase text-gray-500">
                            ID нельзя менять после создания.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-xs uppercase">Описание задания</label>
                        <Textarea
                          value={lessonForm.assignment.description}
                          onChange={(event) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              assignment: { ...prev.assignment, description: event.target.value },
                            }))
                          }
                          className="rounded-none border-2 border-black font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-xs uppercase">Критерии</label>
                        <Textarea
                          value={lessonForm.assignment.criteria}
                          onChange={(event) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              assignment: { ...prev.assignment, criteria: event.target.value },
                            }))
                          }
                          className="rounded-none border-2 border-black font-mono"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wide">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lessonForm.assignment.requiresText}
                            onChange={(event) =>
                              setLessonForm((prev) => ({
                                ...prev,
                                assignment: { ...prev.assignment, requiresText: event.target.checked },
                              }))
                            }
                          />
                          Текст
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lessonForm.assignment.requiresLink}
                            onChange={(event) =>
                              setLessonForm((prev) => ({
                                ...prev,
                                assignment: { ...prev.assignment, requiresLink: event.target.checked },
                              }))
                            }
                          />
                          Ссылка
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={lessonForm.assignment.requiresFile}
                            onChange={(event) =>
                              setLessonForm((prev) => ({
                                ...prev,
                                assignment: { ...prev.assignment, requiresFile: event.target.checked },
                              }))
                            }
                          />
                          Файл
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                        <input
                          type="checkbox"
                          checked={lessonForm.assignment.requiresAny}
                          onChange={(event) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              assignment: { ...prev.assignment, requiresAny: event.target.checked },
                            }))
                          }
                        />
                        Достаточно одного типа ответа
                      </label>
                      {lessonForm.assignment.requiresFile && (
                        <p className="font-mono text-[10px] uppercase text-gray-500">
                          Загрузка файлов в заданиях пока не поддерживается.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase">Порядок</label>
                  <Input
                    type="number"
                    value={lessonForm.orderIndex}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                    className="rounded-none border-2 border-black font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedLessonId && (
                  <Button
                    type="button"
                    className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                    onClick={handleLessonCreate}
                  >
                    Создать урок
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                  onClick={handleLessonUpdate}
                  disabled={!selectedLessonId}
                >
                  Сохранить изменения
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t-2 border-black pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-mono text-lg uppercase tracking-wide">Проверка заданий</h2>
              <p className="font-mono text-xs text-muted-foreground">
                Проверяйте отправленные работы и оставляйте комментарии.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
              onClick={async () => {
                setSubmissionsError(null);
                try {
                  const data = await getAdminSubmissions();
                  setSubmissions(data);
                } catch (error) {
                  setSubmissionsError(getErrorMessage(error, 'Не удалось обновить список заданий.'));
                }
              }}
            >
              Обновить
            </Button>
          </div>

          {submissionsError && (
            <div className="border-2 border-red-600 bg-red-50 p-3">
              <p className="font-mono text-sm text-red-700">{submissionsError}</p>
            </div>
          )}

          {submissionsLoading ? (
            <p className="font-mono text-xs uppercase">Загрузка...</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border-2 border-black p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono text-xs uppercase tracking-wide">
                      {submission.username} · {submission.lesson_id} · v{submission.version}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-wide">
                      {submission.status}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-mono uppercase text-[10px] text-gray-500 mb-1">Текст</div>
                      <div className="border border-black/10 p-2 min-h-[40px] whitespace-pre-wrap">
                        {submission.text_answer ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono uppercase text-[10px] text-gray-500 mb-1">Ссылка</div>
                      <div className="border border-black/10 p-2 min-h-[40px] break-all">
                        {submission.link_url ?? '—'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono uppercase text-[10px] text-gray-500 mb-1">Файлы</div>
                    {submission.file_urls && submission.file_urls.length > 0 ? (
                      <div className="space-y-1 text-xs">
                        {submission.file_urls.map((fileUrl) => (
                          <div key={fileUrl} className="break-all">{fileUrl}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">—</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase text-gray-500">Комментарий</label>
                    <Textarea
                      value={submissionNotes[submission.id] ?? submission.curator_comment ?? ''}
                      onChange={(event) =>
                        setSubmissionNotes((prev) => ({
                          ...prev,
                          [submission.id]: event.target.value,
                        }))
                      }
                      className="rounded-none border-2 border-black font-mono min-h-[80px]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                      disabled={reviewingSubmissionId === submission.id}
                      onClick={() => void handleSubmissionReview(submission, 'accepted')}
                    >
                      Принять
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-black rounded-none font-mono uppercase tracking-wide"
                      disabled={reviewingSubmissionId === submission.id}
                      onClick={() => void handleSubmissionReview(submission, 'needs_revision')}
                    >
                      На доработку
                    </Button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="font-mono text-xs text-muted-foreground">Отправленных заданий нет.</p>
              )}
            </div>
          )}
        </section>
      </div>
      <Dialog open={tempPasswordOpen} onOpenChange={(open) => { setTempPasswordOpen(open); if (!open) { setTempPasswordData(null); } }}>
        <DialogContent className="border-2 border-black rounded-none" onInteractOutside={(event) => event.preventDefault()}>
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
    </div>
  );
}
