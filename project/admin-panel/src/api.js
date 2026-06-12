import axios from 'axios';

// Adresa backend-ului, luata din variabila de mediu sau implicit localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Clientul HTTP folosit de tot panoul
const api = axios.create({ baseURL: `${API_URL}/api` });

// Gestionarea token-ului: functiile sunt setate de AuthContext
let _getAccessToken = () => null;
let _refreshAccessToken = () => Promise.resolve(null);
let _onAuthFailure = () => {};
let _isDemo = false;
let _onDemoBlock = null;

// Primeste de la AuthContext functiile pentru token, reinnoire si esec de autentificare
export function setAuthHelpers(getToken, refreshToken, onFailure) {
  _getAccessToken = getToken;
  _refreshAccessToken = refreshToken;
  _onAuthFailure = onFailure;
}

// Seteaza daca utilizatorul este demo si ce se intampla cand incearca sa scrie
export function setDemoHelper(isDemo, onBlock) {
  _isDemo = isDemo;
  _onDemoBlock = onBlock;
}

// Verifica daca eroarea vine din blocarea scrierilor pentru contul demo
export function isDemoError(err) {
  return !!err?.isDemoBlock;
}

// Interceptor de cereri: adauga token-ul Bearer si blocheaza scrierile in modul demo
api.interceptors.request.use((config) => {
  const token = _getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (_isDemo && config.method && config.method.toLowerCase() !== 'get') {
    if (_onDemoBlock) _onDemoBlock();
    const err = Object.assign(new Error('Demo block'), {
      isDemoBlock: true,
      response: { status: 403, data: { detail: 'Cont demo — modificările nu sunt permise' } },
      isAxiosError: true,
    });
    return Promise.reject(err);
  }
  return config;
});

// Interceptor de raspunsuri: la 401 se reinnoieste token-ul si cererea se reia
// Coada cererilor care asteapta reinnoirea token-ului, ca sa nu se faca mai multe reinnoiri deodata
let isRefreshing = false;
let failedQueue = [];

// Dupa reinnoire, cererile din coada sunt reluate cu noul token sau respinse
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
    if (error.isDemoBlock) return Promise.reject(error);
    const originalRequest = error.config;

    // Doar daca raspunsul este 401 si cererea nu a mai fost reluata
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Rutele de autentificare nu se reiau
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

// Boti
export const getBots = () => api.get('/admin/bots');
export const createBot = (data) => api.post('/admin/bots', data);
export const deleteBot = (botId) => api.delete(`/admin/bots/${botId}`);

// Categorii
export const getCategories = (botId) =>
  api.get('/admin/categories', { params: { bot_id: botId } });
export const createCategory = (name, botId) =>
  api.post('/admin/categories', { name, bot_id: botId });
export const updateCategory = (id, name) => api.put(`/admin/categories/${id}`, { name });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Documente
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

// Configuratia widget-ului (pentru admin: configuratia completa, cu parametrii AI)
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

// Conversatii
export const getConversations = (params = {}) =>
  api.get('/admin/conversations', { params });
export const getConversation = (id) => api.get(`/admin/conversations/${id}`);
export const deleteConversation = (id) => api.delete(`/admin/conversations/${id}`);
export const deleteAllConversations = (botId) =>
  api.delete('/admin/conversations', { params: { bot_id: botId } });

// Statistici
export const getStats = (botId) =>
  api.get('/admin/stats', { params: { bot_id: botId } });

// Recenzii
export const getFeedback = (params = {}) =>
  api.get('/admin/feedback', { params });

export const deleteFeedback = (id) =>
  api.delete(`/admin/feedback/${id}`);

// Notificari
export const getNotifications = (params = {}) =>
  api.get('/admin/notifications', { params });
export const markNotificationsRead = (data, botId) =>
  api.put('/admin/notifications/read', data, { params: { bot_id: botId } });
export const deleteNotification = (id) =>
  api.delete(`/admin/notifications/${id}`);
export const clearNotifications = (botId) =>
  api.delete('/admin/notifications', { params: { bot_id: botId } });

// Live chat
export const getLiveChatConversations = () =>
  api.get('/admin/livechat/conversations');
export const getLiveChatMessages = (conversationId) =>
  api.get(`/admin/livechat/conversations/${conversationId}/messages`);
export const getOperatorStatus = () =>
  api.get('/admin/livechat/operator/status');
export const updateOperatorStatus = (isAvailable) =>
  api.put('/admin/livechat/operator/status', { is_available: isAvailable });
export const getContactSubmissions = () =>
  api.get('/admin/livechat/contacts');
export const markContactRead = (id) =>
  api.put(`/admin/livechat/contacts/${id}/read`);
export const deleteContact = (id) =>
  api.delete(`/admin/livechat/contacts/${id}`);

// Management utilizatori
export const getUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/users', data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
export const resetUserPassword = (id, newPassword) =>
  api.put(`/auth/users/${id}/reset-password`, { new_password: newPassword });

// Profil
export const updateProfile = (data) => api.put('/auth/profile', data);

// WebSocket pentru live chat-ul operatorului
// Deschide conexiunea WebSocket a operatorului (live chat) si trimite mesajele primite, deja parsate, la onMessage
export function connectOperatorWs(token, onMessage, onClose) {
  const wsUrl = (API_URL || 'http://localhost:8000').replace(/^http/, 'ws');
  const ws = new WebSocket(`${wsUrl}/ws/operator?token=${token}`);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch (err) {
      console.error('[WS operator] parse error:', err);
    }
  };
  ws.onclose = (ev) => {
    if (onClose) onClose();
  };
  return ws;
}

// Adresa backend-ului este exportata pentru alte fisiere (de exemplu pentru conexiuni WebSocket)
export { API_URL };
export default api;
