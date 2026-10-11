import { storage } from '../utils/storage';

const API_URL_KEY = '@moviescan_api_url';
const MOCK_MODE_KEY = '@moviescan_mock_mode';
const AUTH_TOKEN_KEY = '@moviescan_auth_token';

export const API_CONFIG = {
  defaultBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
};

export async function getStoredBaseUrl(): Promise<string> {
  const custom = await storage.getItem(API_URL_KEY);
  return custom || API_CONFIG.defaultBaseUrl;
}

export async function setStoredBaseUrl(url: string): Promise<void> {
  await storage.setItem(API_URL_KEY, url);
}

export async function isMockModeActive(): Promise<boolean> {
  const val = await storage.getItem(MOCK_MODE_KEY);
  if (val === null) {
    // Default to true for robust, zero-dependency out-of-the-box demo
    return true;
  }
  return val === 'true';
}

export async function setMockModeActive(active: boolean): Promise<void> {
  await storage.setItem(MOCK_MODE_KEY, active ? 'true' : 'false');
}

export async function getAuthToken(): Promise<string | null> {
  return await storage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) {
    await storage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await storage.removeItem(AUTH_TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = await getStoredBaseUrl();
  const token = await getAuthToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl.replace(/\/$/, '')}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Server returned ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errJson.error || errMsg;
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network timeout: server did not respond');
    }
    throw error;
  }
}
