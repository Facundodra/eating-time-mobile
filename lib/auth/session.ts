import * as SecureStore from 'expo-secure-store';

import type { AuthSession, AuthUser } from './types';

const SESSION_KEY = 'eating_time_session';

export async function saveSession(user: AuthUser, sessionId?: string): Promise<void> {
  const session: AuthSession = { user, sessionId };
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

export async function getSessionId(): Promise<string | null> {
  const session = await getSession();
  return session?.sessionId ?? null;
}
