import axios from 'axios';
import { Platform } from 'react-native';

import { notifySessionExpired } from '@/lib/auth/session-expired';
import { getSessionId } from '@/lib/auth/session';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const sessionId = await getSessionId();

  if (sessionId && Platform.OS !== 'web') {
    config.headers.set('Cookie', `JSESSIONID=${sessionId}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthRoute = /\/api\/auth\//.test(url);

      if (!isAuthRoute) {
        await notifySessionExpired();
      }
    }

    return Promise.reject(error);
  },
);

export function extractSessionId(setCookieHeader?: string | string[]): string | undefined {
  const rawHeader = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  const match = rawHeader?.match(/JSESSIONID=([^;]+)/);
  return match?.[1];
}
