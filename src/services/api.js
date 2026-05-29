import axios from 'axios';

/**
 * API Service
 * Centralized Axios instance for all backend API calls
 * Includes JWT token interceptor for authenticated requests
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes (for bulk email sending)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT token ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 errors ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth APIs ───
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ─── Template APIs ───
export const fetchTemplates = () => api.get('/templates');
export const createTemplate = (data) => api.post('/templates', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
export const resetTemplateToDefault = (id) => api.post(`/templates/${id}/reset`);

// ─── Mail APIs ───
export const sendMails = (data) => api.post('/send-mails', data);
export const verifySmtp = (config) => api.post('/verify-smtp', config);
export const getSmtpSettings = () => api.get('/smtp-settings');

// ─── PDF APIs ───
export const generatePDF = (data) =>
  api.post('/generate-pdf', data, { responseType: 'blob' });
export const previewPDF = (data) => api.post('/preview-pdf', data);

// ─── Upload APIs ───
export const uploadLogo = (formData) =>
  api.post('/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getLogos = () => api.get('/logos');
export const downloadSampleCSV = () =>
  api.get('/sample-csv', { responseType: 'blob' });
export const validateCSV = (data) => api.post('/upload-csv', { data });

export default api;
