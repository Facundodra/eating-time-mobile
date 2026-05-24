import axios from 'axios';

import type { AuthUser, LoginCredentials, LoginMobileResponse, RegisterCredentials } from '@/lib/auth/types';
import { apiClient } from './api-client';

type LoginResult = { token: string; user: AuthUser };

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginMobileResponse>('/api/auth/login-mobile', credentials);
  const user: AuthUser = {
    id: String(data.idUsuario),
    name: data.nombre,
    email: data.email,
  };
  return { token: data.token, user };
}

async function register(credentials: RegisterCredentials): Promise<void> {
  const body = new FormData();
  body.append('nombre', credentials.name);
  body.append('email', credentials.email);
  body.append('cedula', credentials.document);
  body.append('password', credentials.password);

  if (credentials.phone) {
    body.append('telefono', credentials.phone);
  }

  if (credentials.profile_pic) {
    const uri = credentials.profile_pic;
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    body.append('foto', { uri, type, name: `profile.${ext}` } as unknown as Blob);
  }

  try {
    await apiClient.post('/api/auth/registro', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error('No se pudo conectar con el servidor.');
      }
      const data = error.response.data;
      const status = error.response.status;
      const message =
        data?.error ?? data?.message ??
        (status === 400 ? 'El email o la cédula ya están registrados' : `Error al registrar (${status})`);
      throw new Error(message);
    }
    throw new Error('No se pudo registrar. Intentalo nuevamente.');
  }
}

async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout', { isMobile: true });
}

export const authService = { login, register, logout };
