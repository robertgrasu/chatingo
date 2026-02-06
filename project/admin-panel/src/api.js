import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: `${API_URL}/api` });

// Categories
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (name) => api.post('/admin/categories', { name });
export const updateCategory = (id, name) => api.put(`/admin/categories/${id}`, { name });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Documents
export const getDocuments = (categoryId) =>
  api.get('/admin/documents', { params: { category_id: categoryId } });
export const getAllDocuments = () => api.get('/admin/documents');
export const getDocument = (id) => api.get(`/admin/documents/${id}`);
export const updateDocument = (id, data) => api.put(`/admin/documents/${id}`, data);
export const createTextDocument = (title, content, categoryId) =>
  api.post('/admin/documents/text', { title, content, category_id: categoryId });
export const uploadDocument = (file, categoryId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category_id', categoryId);
  return api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteDocument = (id) => api.delete(`/admin/documents/${id}`);

// Widget config
export const getWidgetConfig = (botId = 'bot_123') =>
  api.get(`/widget/config/${botId}`);
export const updateWidgetConfig = (data, botId = 'bot_123') =>
  api.put(`/widget/config/${botId}`, data);

// Conversations
export const getConversations = (params = {}) =>
  api.get('/admin/conversations', { params });
export const getConversation = (id) => api.get(`/admin/conversations/${id}`);
export const deleteConversation = (id) => api.delete(`/admin/conversations/${id}`);
export const deleteAllConversations = () => api.delete('/admin/conversations');

// Stats
export const getStats = () => api.get('/admin/stats');

export default api;
