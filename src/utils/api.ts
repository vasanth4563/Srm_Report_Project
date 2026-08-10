import { baseUrl } from '../config/urls.ts';
const API_BASE_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = sessionStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});

  // Set auth header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set json content type if body exists and not FormData
  if (options.bodyData !== undefined) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.bodyData);
  } else if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  } else if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as any;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Something went wrong');
  }

  return response.json();
}
