import { handleMockApiRequest } from './mockApi';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('whitehouse_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 404 or server not present on static host (GitHub Pages), fallback to mock API
      if (response.status === 404 && typeof window !== 'undefined') {
        const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
        return handleMockApiRequest(endpoint, options.method || 'GET', bodyObj);
      }

      if (response.status === 401) {
        if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
          localStorage.removeItem('whitehouse_token');
          localStorage.removeItem('whitehouse_user');
        }
      }
      throw new ApiError(data.message || 'An error occurred during request', response.status, data);
    }

    return data as T;
  } catch (err: any) {
    // If fetch failed completely (e.g. static GitHub Pages without backend), use Mock DB
    if (typeof window !== 'undefined') {
      const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
      return handleMockApiRequest(endpoint, options.method || 'GET', bodyObj);
    }
    throw err;
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
