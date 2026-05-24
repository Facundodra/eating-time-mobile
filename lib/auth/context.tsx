import { createContext, useContext, useEffect, useState } from 'react';

import { clearSession, getSession, saveSession } from './session';
import type { AuthUser, LoginCredentials } from './types';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setUser(session.user);
        setToken(session.token);
      }
      setIsLoading(false);
    });
  }, []);

  async function setSession(newToken: string, newUser: AuthUser) {
    await saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }

  async function login(credentials: LoginCredentials) {
    const { authService } = await import('@/services/auth-service');
    const { token: newToken, user: newUser } = await authService.login(credentials);
    await setSession(newToken, newUser);
  }

  async function logout() {
    await clearSession();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
