import {
  Application,
  ApplicationFormData,
  DashboardStats,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }

  return data;
}

export const api = {
  signup: (email: string, password: string, name: string) =>
    request<{ user: { id: number; email: string; name: string }; token: string }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    ),

  login: (email: string, password: string) =>
    request<{ user: { id: number; email: string; name: string }; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  getMe: () =>
    request<{ user: { id: number; email: string; name: string } }>('/auth/me'),

  getDashboard: () => request<DashboardStats>('/applications/dashboard'),

  getApplications: (filters?: {
    company?: string;
    role?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.company) params.set('company', filters.company);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return request<{ applications: Application[] }>(
      `/applications${query ? `?${query}` : ''}`
    );
  },

  createApplication: (data: Partial<ApplicationFormData>) =>
    request<{ application: Application }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateApplication: (id: number, data: Partial<ApplicationFormData>) =>
    request<{ application: Application }>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteApplication: (id: number) =>
    request<void>(`/applications/${id}`, { method: 'DELETE' }),
};

export { ApiError };
