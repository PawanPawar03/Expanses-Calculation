import { handleMockApiRequest } from './mockApi';

export const isGitHubPagesStatic = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('wh_cloud_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/+$/, '');
    }
  }
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv?.VITE_API_URL) {
    return (metaEnv.VITE_API_URL as string).replace(/\/+$/, '');
  }
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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If on GitHub Pages and no custom remote backend is configured, use Mock DB directly
  const hasCustomBackend = apiBase !== '/api';
  if (isGitHubPagesStatic() && !hasCustomBackend) {
    const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
    return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = apiBase.endsWith('/api') ? `${apiBase}${cleanEndpoint}` : `${apiBase}/api${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      // If 404/405/non-JSON on default proxy, fallback to mock DB
      if ((response.status === 404 || response.status === 405 || !isJson) && !hasCustomBackend) {
        const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
        return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
      }

      if (response.status === 401) {
        if (cleanEndpoint !== '/auth/login' && cleanEndpoint !== '/auth/register') {
          localStorage.removeItem('whitehouse_token');
          localStorage.removeItem('whitehouse_user');
        }
      }
      const errMsg = data.message || (typeof data.error === 'string' ? data.error : '') || 'Invalid request';
      throw new ApiError(errMsg, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      // If error is from an unconfigured backend, fallback to mock DB
      if (!hasCustomBackend) {
        const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
        return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
      }
      throw err;
    }
    // Network failure (server down/offline) -> Fallback to mock DB
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
