import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://devsecure-1opt.onrender.com/api';


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (email, password, full_name) =>
  api.post('/auth/register', { email, password, full_name });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// Organization APIs
export const createOrganization = (name) =>
  api.post('/organizations', { name });

export const getOrganizations = () => api.get('/organizations');

export const switchOrganization = (organizationId) =>
  api.post(`/organizations/switch/${organizationId}`);

export const getActiveOrganization = () => api.get('/organizations/active');

export const getMe = () => api.get('/auth/me');

// Secret APIs
export const createSecret = (organizationId, key_name, plain_value) =>
  api.post(`/${organizationId}/secrets`, { key_name, plain_value, organizationId });

export const getSecrets = (organizationId) =>
  api.get(`/${organizationId}/secrets`);

export const deleteSecret = (organizationId, secretId) =>
  api.delete(`/${organizationId}/secrets/${secretId}`);

export default api;
