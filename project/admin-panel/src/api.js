import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: `${API_URL}/api` });

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

// Widget config
export const getWidgetConfig = (botId) =>
  api.get(`/widget/config/${botId}`);
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

export default api;
