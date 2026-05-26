import axios from 'axios';

/**
 * API Service
 * Centralized Axios instance for all backend API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes (for bulk email sending)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Template APIs ───
export const fetchTemplates = () => api.get('/templates');
export const createTemplate = (data) => api.post('/templates', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

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
