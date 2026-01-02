const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth_token');
}

export function getAuthToken(): string | null {
  return authToken;
}

// Base fetch wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Обработка сетевых ошибок
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Не удалось подключиться к серверу. Проверьте, что backend запущен на ${API_BASE_URL}`);
    }
    throw error;
  }
}

// Auth API
export const authAPI = {
  async register(username: string, email: string, password: string, fullName?: string) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
  },

  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Неверное имя пользователя или пароль' }));
        throw new Error(error.detail || 'Ошибка входа');
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      return data;
    } catch (error) {
      // Обработка сетевых ошибок
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Не удалось подключиться к серверу. Проверьте, что backend запущен на ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  logout() {
    clearAuthToken();
  },
};

// Users API
export const usersAPI = {
  async getCurrentUser() {
    return apiFetch('/users/me');
  },
};

// Tracks API
export const tracksAPI = {
  async getAll() {
    return apiFetch('/tracks/');
  },

  async getById(trackId: string) {
    return apiFetch(`/tracks/${trackId}`);
  },
};

// Courses API
export const coursesAPI = {
  async getAll(trackId?: string) {
    const params = trackId ? `?track_id=${trackId}` : '';
    return apiFetch(`/courses${params}`);
  },

  async getById(courseId: string) {
    return apiFetch(`/courses/${courseId}`);
  },

  async enroll(courseId: string) {
    return apiFetch(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  },

  async updateProgress(courseId: string, progress: number, status: string) {
    return apiFetch(`/courses/${courseId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress, status }),
    });
  },
};

// Modules API
export const modulesAPI = {
  async getByCourseId(courseId: string) {
    return apiFetch(`/modules/course/${courseId}`);
  },

  async getById(moduleId: string) {
    return apiFetch(`/modules/${moduleId}`);
  },

  async getProgress(moduleId: string) {
    return apiFetch(`/modules/${moduleId}/progress`);
  },
};

// Lessons API
export const lessonsAPI = {
  async getByModuleId(moduleId: string) {
    return apiFetch(`/lessons/module/${moduleId}`);
  },

  async getById(lessonId: string) {
    return apiFetch(`/lessons/${lessonId}`);
  },

  async updateProgress(lessonId: string, status: string) {
    return apiFetch(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};

// Graph API
export const graphAPI = {
  async getNodes() {
    return apiFetch('/graph/nodes');
  },

  async getEdges() {
    return apiFetch('/graph/edges');
  },
};

// Submissions API
export const submissionsAPI = {
  async create(data: {
    assignment_id: string;
    text_answer?: string;
    link_url?: string;
    file_urls?: string[];
  }) {
    return apiFetch('/submissions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll() {
    return apiFetch('/submissions/');
  },
};

// Notifications API
export const notificationsAPI = {
  async getAll(unreadOnly: boolean = false) {
    return apiFetch(`/notifications/?unread_only=${unreadOnly}`);
  },

  async markAsRead(notificationId: string) {
    return apiFetch(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },
};

