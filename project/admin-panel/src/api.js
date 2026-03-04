import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: `${API_URL}/api` });

// Auth token management - set by AuthContext
let _getAccessToken = () => null;
let _refreshAccessToken = () => Promise.resolve(null);
let _onAuthFailure = () => {};

export function setAuthHelpers(getToken, refreshToken, onFailure) {
  _getAccessToken = getToken;
  _refreshAccessToken = refreshToken;
  _onAuthFailure = onFailure;
}

// Request interceptor: inject Bearer token
api.interceptors.request.use((config) => {
  const token = _getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (token) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    } else {
      reject(new Error('Auth failed'));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await _refreshAccessToken();
        isRefreshing = false;
        if (newToken) {
          processQueue(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          processQueue(null);
          _onAuthFailure();
          return Promise.reject(error);
        }
      } catch {
        isRefreshing = false;
        processQueue(null);
        _onAuthFailure();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Bots
export const getBots = () => api.get('/admin/bots');
export const createBot = (data) => api.post('/admin/bots', data);
export const deleteBot = (botId) => api.delete(`/admin/bots/${botId}`);

// Categories
export const getCategories = (botId) =>
  api.get('/admin/categories', { params: { bot_id: botId } });
export const createCategory = (name, botId) =>
  api.post('/admin/categories', { name, bot_id: botId });
export const updateCategory = (id, name) => api.put(`/admin/categories/${id}`, { name });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Documents
export const getDocuments = (categoryId, botId) =>
  api.get('/admin/documents', { params: { category_id: categoryId, bot_id: botId } });
export const getAllDocuments = (botId) =>
  api.get('/admin/documents', { params: { bot_id: botId } });
export const getDocument = (id) => api.get(`/admin/documents/${id}`);
export const updateDocument = (id, data) => api.put(`/admin/documents/${id}`, data);
export const createTextDocument = (title, content, categoryId) =>
  api.post('/admin/documents/text', { title, content, category_id: categoryId });
export const uploadDocument = (file, categoryId, botId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category_id', categoryId);
  formData.append('bot_id', botId);
  return api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteDocument = (id) => api.delete(`/admin/documents/${id}`);

// Widget config (admin: full config with AI params, requires auth)
export const getWidgetConfig = (botId) =>
  api.get(`/widget/config/${botId}/full`);
export const updateWidgetConfig = (data, botId) =>
  api.put(`/widget/config/${botId}`, data);
export const uploadAvatar = (file, botId) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/widget/avatar/${botId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteAvatar = (botId) =>
  api.delete(`/widget/avatar/${botId}`);

// Conversations
export const getConversations = (params = {}) =>
  api.get('/admin/conversations', { params });
export const getConversation = (id) => api.get(`/admin/conversations/${id}`);
export const deleteConversation = (id) => api.delete(`/admin/conversations/${id}`);
export const deleteAllConversations = (botId) =>
  api.delete('/admin/conversations', { params: { bot_id: botId } });

// Stats
export const getStats = (botId) =>
  api.get('/admin/stats', { params: { bot_id: botId } });

// Feedback / Reviews
export const getFeedback = (params = {}) =>
  api.get('/admin/feedback', { params });

// Notifications
export const getNotifications = (params = {}) =>
  api.get('/admin/notifications', { params });
export const markNotificationsRead = (data, botId) =>
  api.put('/admin/notifications/read', data, { params: { bot_id: botId } });
export const deleteNotification = (id) =>
  api.delete(`/admin/notifications/${id}`);
export const clearNotifications = (botId) =>
  api.delete('/admin/notifications', { params: { bot_id: botId } });

export default api;
