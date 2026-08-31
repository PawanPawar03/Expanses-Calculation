import { handleMockApiRequest } from './mockApi';

export const getApiBaseUrl = (): string => {
  // 1. Check user configured cloud backend in localStorage
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('wh_cloud_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/+$/, '');
    }
  }
  // 2. Check Vite env variable
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv?.VITE_API_URL) {
    return (metaEnv.VITE_API_URL as string).replace(/\/+$/, '');
  }
  // 3. Default relative path for local proxy & fullstack deployment
  return '/api';
};

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
  const apiBase = getApiBaseUrl();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = apiBase.endsWith('/api') ? `${apiBase}${cleanEndpoint}` : `${apiBase}/api${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 404 or backend not reachable on GitHub Pages, fallback to browser storage
      if (response.status === 404 && typeof window !== 'undefined' && apiBase === '/api') {
        const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
        return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
      }

      if (response.status === 401) {
        if (cleanEndpoint !== '/auth/login' && cleanEndpoint !== '/auth/register') {
          localStorage.removeItem('whitehouse_token');
          localStorage.removeItem('whitehouse_user');
        }
      }
      throw new ApiError(data.message || 'An error occurred during request', response.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Fallback if local/remote server not running
    if (typeof window !== 'undefined') {
      const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
      return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
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
