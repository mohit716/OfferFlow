import {
  Application,
  ApplicationFormData,
  DashboardStats,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Access token is kept in memory only (not localStorage) to reduce XSS risk.
// The refresh token lives in an httpOnly cookie the browser sends automatically.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

/** Attempt to refresh the access token using the httpOnly refresh cookie. */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.token;
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(options.headers),
    credentials: 'include',
  });

  // Access token likely expired: refresh once and retry (never for /auth/*).
  if (
    response.status === 401 &&
    retry &&
    !endpoint.startsWith('/auth/')
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(endpoint, options, false);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }

  return data;
}

interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedApplications {
  applications: Application[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApplicationQuery {
  company?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const api = {
  signup: (email: string, password: string, name: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  getMe: () => request<{ user: User }>('/auth/me'),

  getDashboard: () => request<DashboardStats>('/applications/dashboard'),

  getApplications: (filters?: ApplicationQuery) => {
    const params = new URLSearchParams();
    if (filters?.company) params.set('company', filters.company);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit != null) params.set('limit', String(filters.limit));
    if (filters?.offset != null) params.set('offset', String(filters.offset));
    const query = params.toString();
    return request<PaginatedApplications>(
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
