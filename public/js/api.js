// API Helper Module
const API_BASE = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class API {
  static isOnline = true;
  static retryCount = {};

  // Initialize network listeners
  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  static handleOnline() {
    this.isOnline = true;
    console.log('Network: Online');
    if (window.Toast) {
      Toast.show('Connection restored', 'success');
    }
  }

  static handleOffline() {
    this.isOnline = false;
    console.log('Network: Offline');
    if (window.Toast) {
      Toast.show('You are offline. Some features may not work.', 'warning');
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      credentials: 'include',
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // Check if offline
    if (!this.isOnline && typeof navigator !== 'undefined') {
      throw { 
        error: 'You are currently offline. Please check your internet connection.', 
        code: 'OFFLINE',
        retry: true 
      };
    }

    let lastError;
    const retryKey = `${options.method || 'GET'}${endpoint}`;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, config);
        
        // Handle 401 - Unauthorized (token expired)
        if (response.status === 401) {
          localStorage.removeItem('token');
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          throw { 
            error: 'Your session has expired. Please log in again.', 
            code: 'UNAUTHORIZED' 
          };
        }

        // Handle 403 - Forbidden
        if (response.status === 403) {
          const data = await response.json();
          throw { 
            error: data.error || 'Access denied', 
            code: 'FORBIDDEN' 
          };
        }

        // Handle 404 - Not Found
        if (response.status === 404) {
          throw { 
            error: 'The requested resource was not found', 
            code: 'NOT_FOUND' 
          };
        }

        // Handle 429 - Too Many Requests
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 5;
          throw { 
            error: `Too many requests. Please wait ${retryAfter} seconds.`, 
            code: 'RATE_LIMIT',
            retry: true,
            retryAfter: parseInt(retryAfter)
          };
        }

        // Handle 500+ Server Errors
        if (response.status >= 500) {
          throw { 
            error: 'Server error. Please try again later.', 
            code: 'SERVER_ERROR',
            retry: attempt < MAX_RETRIES
          };
        }

        const data = await response.json();

        if (!response.ok) {
          throw data;
        }

        // Success - reset retry count
        this.retryCount[retryKey] = 0;
        return data;

      } catch (error) {
        lastError = error;
        
        // Don't retry for certain errors
        if (error.code === 'OFFLINE' || 
            error.code === 'UNAUTHORIZED' || 
            error.code === 'FORBIDDEN' || 
            error.code === 'NOT_FOUND') {
          throw error;
        }

        // Retry logic
        if (attempt < MAX_RETRIES && (error.retry || error.code === 'SERVER_ERROR')) {
          const delay = RETRY_DELAY * attempt;
          console.log(`Retry ${attempt}/${MAX_RETRIES} for ${endpoint} after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        // Log error for debugging
        this.logError(endpoint, options.method || 'GET', error);
      }
    }

    // All retries failed
    throw this.formatError(lastError);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatError(error) {
    if (!error) {
      return { error: 'An unknown error occurred. Please try again.' };
    }

    // Already formatted
    if (error.error) {
      return error;
    }

    // Network error
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      return { 
        error: 'Unable to connect to server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    }

    // Parse error
    if (error instanceof SyntaxError) {
      return { 
        error: 'Invalid response from server. Please try again.',
        code: 'PARSE_ERROR'
      };
    }

    // Generic error
    return { 
      error: error.message || 'An error occurred. Please try again.',
      code: 'UNKNOWN_ERROR'
    };
  }

  static logError(endpoint, method, error) {
    const errorLog = {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      error: error.error || error.message || 'Unknown error',
      code: error.code
    };
    
    // Store in sessionStorage for debugging
    const logs = JSON.parse(sessionStorage.getItem('api_errors') || '[]');
    logs.push(errorLog);
    
    // Keep only last 10 errors
    if (logs.length > 10) {
      logs.shift();
    }
    
    sessionStorage.setItem('api_errors', JSON.stringify(logs));
    console.error('API Error:', errorLog);
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  static put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  static patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Initialize API
API.init();

// Auth API
API.auth = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  logout: () => API.post('/auth/logout'),
  me: () => API.get('/auth/me'),
  profile: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/password', data)
};

// Clients API
API.clients = {
  getAll: () => API.get('/clients'),
  getById: (id) => API.get(`/clients/${id}`),
  create: (data) => API.post('/clients', data),
  update: (id, data) => API.put(`/clients/${id}`, data),
  delete: (id) => API.delete(`/clients/${id}`),
  stats: () => API.get('/clients/stats')
};

// Projects API
API.projects = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  stats: () => API.get('/projects/stats')
};

// Tasks API
API.tasks = {
  getAll: () => API.get('/tasks'),
  getById: (id) => API.get(`/tasks/${id}`),
  getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => API.delete(`/tasks/${id}`),
  stats: () => API.get('/tasks/stats')
};

// Invoices API
API.invoices = {
  getAll: () => API.get('/invoices'),
  getById: (id) => API.get(`/invoices/${id}`),
  getNextNumber: () => API.get('/invoices/next-number'),
  create: (data) => API.post('/invoices', data),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  updateStatus: (id, status) => API.patch(`/invoices/${id}/status`, { status }),
  delete: (id) => API.delete(`/invoices/${id}`),
  stats: () => API.get('/invoices/stats')
};

// Time Logs API
API.timelogs = {
  getAll: () => API.get('/timelogs'),
  getById: (id) => API.get(`/timelogs/${id}`),
  getByProject: (projectId) => API.get(`/timelogs/project/${projectId}`),
  getActive: () => API.get('/timelogs/active'),
  startTimer: (data) => API.post('/timelogs/start', data),
  stopTimer: (id) => API.post(`/timelogs/stop/${id}`),
  create: (data) => API.post('/timelogs', data),
  update: (id, data) => API.put(`/timelogs/${id}`, data),
  delete: (id) => API.delete(`/timelogs/${id}`),
  stats: () => API.get('/timelogs/stats')
};

// Recurring Invoices API
API.recurringInvoices = {
  getAll: () => API.get('/recurring-invoices'),
  getById: (id) => API.get(`/recurring-invoices/${id}`),
  create: (data) => API.post('/recurring-invoices', data),
  update: (id, data) => API.put(`/recurring-invoices/${id}`, data),
  delete: (id) => API.delete(`/recurring-invoices/${id}`),
  getDue: () => API.get('/recurring-invoices/due'),
  generateInvoice: (id) => API.post(`/recurring-invoices/${id}/generate`)
};

// Admin API
API.admin = {
  getUsers: () => API.get('/admin/users'),
  updateUserRole: (id, role) => API.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getStats: () => API.get('/admin/stats')
};

// Backup/Restore API
API.backup = {
  getBackup: () => API.get('/backup'),
  restore: (data) => API.post('/backup/restore', data),
  uploadRestore: (fileContent) => API.post('/backup/restore/upload', { backupData: fileContent })
};

export { API };
