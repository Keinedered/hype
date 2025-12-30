const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token management
function getAuthToken(): string | null {
  return localStorage.getItem('token') || localStorage.getItem('auth_token');
}

// Base fetch wrapper with better error handling
async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
      });
    } catch (fetchError: any) {
      throw fetchError;
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      // Не делаем редирект сразу, чтобы не прерывать обработку ошибки
      // Редирект будет выполнен в компоненте после обработки ошибки
      throw new Error('Unauthorized - требуется авторизация');
    }

    // Handle network errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorDetail = 'Ошибка запроса';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorJson.message || errorDetail;
      } catch {
        errorDetail = errorText || `HTTP ${response.status}`;
      }
      
      throw new Error(errorDetail);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Неверный формат ответа от сервера: ${parseError}`);
      }
    }
    
    return null;
  } catch (error) {
    // Handle network connection errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Не удалось подключиться к серверу.\n` +
        `Проверьте, что backend запущен на ${API_BASE_URL}\n` +
        `Ошибка: ${error.message}`
      );
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Admin API
export const adminAPI = {
  // Courses
  courses: {
    async getAll() {
      return adminFetch('/admin/courses');
    },
    
    async getById(courseId: string) {
      return adminFetch(`/admin/courses/${courseId}`);
    },
    
    async create(data: any, options?: { createGraphNode?: boolean; x?: number; y?: number }) {
      const params = new URLSearchParams();
      if (options?.createGraphNode !== undefined) {
        params.append('create_graph_node', String(options.createGraphNode));
      }
      if (options?.x !== undefined) {
        params.append('x', String(options.x));
      }
      if (options?.y !== undefined) {
        params.append('y', String(options.y));
      }
      const queryString = params.toString();
      const url = queryString ? `/admin/courses?${queryString}` : '/admin/courses';
      return adminFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(courseId: string, data: any) {
      return adminFetch(`/admin/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(courseId: string) {
      return adminFetch(`/admin/courses/${courseId}`, {
        method: 'DELETE',
      });
    },
    
    async publish(courseId: string) {
      return adminFetch(`/admin/courses/${courseId}/publish`, {
        method: 'POST',
      });
    },
  },

  // Modules
  modules: {
    async getAll(courseId?: string) {
      const params = courseId ? `?course_id=${courseId}` : '';
      return adminFetch(`/admin/modules${params}`);
    },
    
    async getById(moduleId: string) {
      return adminFetch(`/admin/modules/${moduleId}`);
    },
    
    async create(data: any, options?: { createGraphNode?: boolean; x?: number; y?: number }) {
      const params = new URLSearchParams();
      if (options?.createGraphNode !== undefined) {
        params.append('create_graph_node', String(options.createGraphNode));
      }
      if (options?.x !== undefined) {
        params.append('x', String(options.x));
      }
      if (options?.y !== undefined) {
        params.append('y', String(options.y));
      }
      const queryString = params.toString();
      const url = queryString ? `/admin/modules?${queryString}` : '/admin/modules';
      return adminFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(moduleId: string, data: any) {
      return adminFetch(`/admin/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(moduleId: string) {
      return adminFetch(`/admin/modules/${moduleId}`, {
        method: 'DELETE',
      });
    },
  },

  // Lessons
  lessons: {
    async getAll(options?: { module_id?: string }) {
      const params = new URLSearchParams();
      if (options?.module_id) {
        params.append('module_id', options.module_id);
      }
      const queryString = params.toString();
      const url = queryString ? `/admin/lessons?${queryString}` : '/admin/lessons';
      return adminFetch(url);
    },
    
    async getById(lessonId: string) {
      return adminFetch(`/admin/lessons/${lessonId}`);
    },
    
    async create(data: any, options?: { createGraphNode?: boolean; x?: number; y?: number }) {
      const params = new URLSearchParams();
      if (options?.createGraphNode !== undefined) {
        params.append('create_graph_node', String(options.createGraphNode));
      }
      if (options?.x !== undefined) {
        params.append('x', String(options.x));
      }
      if (options?.y !== undefined) {
        params.append('y', String(options.y));
      }
      const queryString = params.toString();
      const url = queryString ? `/admin/lessons?${queryString}` : '/admin/lessons';
      return adminFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(lessonId: string, data: any) {
      return adminFetch(`/admin/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(lessonId: string) {
      return adminFetch(`/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });
    },
  },

  // Graph
  graph: {
    async getNodes() {
      return adminFetch('/admin/graph/nodes');
    },
    
    async getEdges() {
      return adminFetch('/admin/graph/edges');
    },
    
    async createNode(data: any) {
      return adminFetch('/admin/graph/nodes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async updateNode(nodeId: string, data: any) {
      return adminFetch(`/admin/graph/nodes/${nodeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async batchUpdateNodes(updates: any[]) {
      return adminFetch('/admin/graph/nodes/batch-update', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    
    async deleteNode(nodeId: string) {
      return adminFetch(`/admin/graph/nodes/${nodeId}`, {
        method: 'DELETE',
      });
    },
    
    async createEdge(data: any) {
      return adminFetch('/admin/graph/edges', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async updateEdge(edgeId: string, edgeType: string) {
      // EdgeType передается как query параметр согласно роутеру
      return adminFetch(`/admin/graph/edges/${edgeId}?edge_type=${edgeType}`, {
        method: 'PUT',
      });
    },
    
    async deleteEdge(edgeId: string) {
      return adminFetch(`/admin/graph/edges/${edgeId}`, {
        method: 'DELETE',
      });
    },
  },

  // Submissions
  submissions: {
    async getAll(statusFilter?: string) {
      const params = statusFilter ? `?status_filter=${statusFilter}` : '';
      return adminFetch(`/admin/submissions${params}`);
    },
    
    async grade(submissionId: string, status: string, comment?: string) {
      const params = new URLSearchParams({ status });
      if (comment) params.append('curator_comment', comment);
      return adminFetch(`/admin/submissions/${submissionId}/grade?${params.toString()}`, {
        method: 'PUT',
      });
    },
  },

  // Assignments
  assignments: {
    async getAll() {
      return adminFetch('/admin/assignments');
    },
    
    async create(data: any) {
      return adminFetch('/admin/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(assignmentId: string, data: any) {
      return adminFetch(`/admin/assignments/${assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(assignmentId: string) {
      return adminFetch(`/admin/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
    },
  },

  // Handbook
  handbook: {
    async getArticles() {
      return adminFetch('/admin/handbook-articles');
    },
    
    async createArticle(data: any) {
      return adminFetch('/admin/handbook-articles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async updateArticle(articleId: string, data: any) {
      return adminFetch(`/admin/handbook-articles/${articleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async deleteArticle(articleId: string) {
      return adminFetch(`/admin/handbook-articles/${articleId}`, {
        method: 'DELETE',
      });
    },
  },

  // Users
  users: {
    async getAll() {
      return adminFetch('/admin/users');
    },
    
    async getById(userId: string) {
      return adminFetch(`/admin/users/${userId}`);
    },
    
    async update(userId: string, data: any) {
      return adminFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(userId: string) {
      return adminFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  // Analytics
  analytics: {
    async get(timeRange: string = 'all') {
      return adminFetch(`/admin/analytics?time_range=${timeRange}`);
    },
  },
};

// Health check
export async function checkServerHealth(): Promise<boolean> {
  try {
    const healthUrl = `${API_BASE_URL.replace('/api/v1', '')}/health`;
    const response = await fetch(healthUrl);
    return response.ok;
  } catch (error: any) {
    return false;
  }
}

