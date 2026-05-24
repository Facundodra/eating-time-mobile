import * as SecureStore from 'expo-secure-store';

import type { AuthSession, AuthUser } from './types';

const SESSION_KEY = 'eating_time_session';

export async function saveSession(token: string, user: AuthUser): Promise<void> {
  const session: AuthSession = { token, user };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
