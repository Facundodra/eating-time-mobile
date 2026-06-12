import { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';

import { registerSessionExpiredHandler } from './session-expired';
import { clearSession, getSession, saveSession } from './session';
import type { AuthUser, LoginCredentials } from './types';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: AuthUser, sessionId?: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setUser(session.user);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(async () => {
      await clearSession();
      setUser(null);
      router.replace('/auth/login');
    });

    return () => registerSessionExpiredHandler(null);
  }, []);

  async function setSession(newUser: AuthUser, sessionId?: string) {
    await saveSession(newUser, sessionId);
    setUser(newUser);
  }

  async function login(credentials: LoginCredentials) {
    const { authService } = await import('@/services/auth-service');
    const { sessionId, user: newUser } = await authService.login(credentials);
    await setSession(newUser, sessionId);
  }

  async function logout() {
    try {
      const { authService } = await import('@/services/auth-service');
      await authService.logout();
    } finally {
      await clearSession();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
