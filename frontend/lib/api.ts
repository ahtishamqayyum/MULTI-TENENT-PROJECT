import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  name: string;
  tenant_id: number;
  tenant_name?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  created_by_email?: string;
  tenant_id?: number;
  created_by?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Tenant {
  id: number;
  name: string;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, name: string, tenant_id: number) => {
    const response = await api.post('/auth/register', { email, password, name, tenant_id });
    return response.data;
  },
  getTenants: async (): Promise<Tenant[]> => {
    const response = await api.get('/auth/tenants');
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (email: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, newPassword });
    return response.data;
  },
};

export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  create: async (name: string, description: string): Promise<Project> => {
    const response = await api.post('/projects', { name, description });
    return response.data;
  },
  update: async (id: number, name: string, description: string): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, { name, description });
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

export default api;




