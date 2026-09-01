import { handleMockApiRequest, initMockDb } from './mockApi';

export const AWS_DEFAULT_BACKEND_URL = 'http://whitehouse-backend-env.eba-3yfvqujb.ap-south-1.elasticbeanstalk.com';

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
  // Default to live AWS Elastic Beanstalk backend for instant multi-device sync
  return AWS_DEFAULT_BACKEND_URL;
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
      if (response.status === 401 && cleanEndpoint !== '/auth/login' && cleanEndpoint !== '/auth/register') {
        localStorage.removeItem('whitehouse_token');
        localStorage.removeItem('whitehouse_user');
      }

      const errMsg = data.message || (typeof data.error === 'string' ? data.error : '') || 'Invalid request';
      throw new ApiError(errMsg, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    // If backend is unreachable or offline, fallback to mock DB as offline safety
    if (typeof window !== 'undefined') {
      const bodyObj = options.body ? JSON.parse(options.body as string) : undefined;
      try {
        return handleMockApiRequest(cleanEndpoint, options.method || 'GET', bodyObj);
      } catch (mockErr: any) {
        throw new Error(mockErr.message || err.message || 'Request failed');
      }
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
