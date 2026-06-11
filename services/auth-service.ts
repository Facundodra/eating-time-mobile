import axios, { type AxiosError } from 'axios';

import type { AuthUser, LoginCredentials, LoginMobileResponse, RegisterCredentials } from '@/lib/auth/types';
import { apiClient, extractSessionId } from './api-client';

type LoginResult = { sessionId?: string; user: AuthUser };
type ErrorResponse = { error?: string; message?: string };

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  let fcmToken: string | undefined;
  try {
    fcmToken = await getLoginFcmToken();
  } catch (error) {
    console.warn('No se pudo obtener el token de notificaciones push:', error);
  }

  try {
    const response = await apiClient.post<LoginMobileResponse>('/api/auth/login-mobile', {
      ...credentials,
      fcmToken,
    });

    const user: AuthUser = {
      id: String(response.data.idUsuario),
      roleId: String(response.data.idTipoUsuario),
      role: response.data.tipoUsuario,
      name: credentials.email,
      email: credentials.email,
    };

    return {
      sessionId: extractSessionId(response.headers['set-cookie']),
      user,
    };
  } catch (error) {
    if (axios.isAxiosError<ErrorResponse>(error)) {
      throw mapLoginError(error);
    }

    throw new LoginError('No se pudo iniciar sesión. Intentalo nuevamente.');
  }
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

async function getLoginFcmToken(): Promise<string> {
  try {
    const {
      configureNotifications,
      getFirebaseDeviceToken,
      requestNotificationPermissions,
    } = await import('@/services/notifications');

    await configureNotifications();
    const granted = await requestNotificationPermissions();

    if (!granted) {
      throw new LoginError('Necesitamos permisos de notificaciones para iniciar sesión.');
    }

    return await getFirebaseDeviceToken();
  } catch (error) {
    if (error instanceof LoginError) {
      throw error;
    }

    throw new LoginError(
      'No se pudo obtener el token de notificaciones. Probá desde un development build.'
    );
  }
}

function mapLoginError(error: AxiosError<ErrorResponse>) {
  const status = error.response?.status;
  const responseMessage = error.response?.data?.error ?? error.response?.data?.message;

  if (!error.response) {
    return new LoginError('No se pudo conectar con el servidor.');
  }

  if (status === 400) {
    return new LoginError(responseMessage ?? 'Revisá los datos ingresados.', 400);
  }

  if (status === 401) {
    return new LoginError('Credenciales incorrectas', 401);
  }

  if (status === 403) {
    return new LoginError(responseMessage ?? 'No tenés permiso para ingresar.', 403);
  }

  return new LoginError('No se pudo iniciar sesión. Intentalo nuevamente.', status);
}

export const authService = { login, register, logout };



// Reecuperar contrasena 
export async function resetPassword(email: string): Promise<void> {
  await apiClient.post("/api/auth/recuperar-password", { email });
}

export class PasswordResetError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid" | "expired" | "validation",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export async function confirmPasswordReset(
  token: string,
  nuevaPassword: string,
): Promise<void> {
  try {
    await apiClient.post("/api/auth/restablecer-password", {
      token,
      nuevaPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new PasswordResetError("El enlace no es válido.", "invalid", 404);
      }
      if (status === 410) {
        throw new PasswordResetError(
          "El enlace expiró o ya fue utilizado. Solicitá uno nuevo.",
          "expired",
          410,
        );
      }
      if (status === 400) {
        const msg =
          error.response?.data?.nuevaPassword ??
          error.response?.data?.message ??
          "La contraseña no es válida.";
        throw new PasswordResetError(msg, "validation", 400);
      }
    }
    throw new PasswordResetError(
      "No se pudo restablecer la contraseña. Intentalo nuevamente.",
      "invalid",
    );
  }
}


export class ChangePasswordError extends Error {
  constructor(
    message: string,
    public readonly code: "wrong_password" | "validation" | "unauthorized",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ChangePasswordError";
  }
}

export async function changePassword(
  passwordActual: string,
  nuevaPassword: string,
): Promise<void> {
  try {
    await apiClient.patch("/api/auth/cambiar-password", {
      passwordActual,
      nuevaPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400) {
        const msg =
          error.response?.data?.error ??
          error.response?.data?.nuevaPassword ??
          "Revisá los datos ingresados.";
        throw new ChangePasswordError(msg, "wrong_password", 400);
      }
      if (status === 401) {
        throw new ChangePasswordError("Tu sesión expiró.", "unauthorized", 401);
      }
    }
    throw new ChangePasswordError(
      "No se pudo cambiar la contraseña. Intentalo nuevamente.",
      "wrong_password",
    );
  }
}



// Sesión actual
export type SessionInfo = {
  tipoUsuario: 'CLIENTE';
  idUsuario: number;
  idTipoUsuario: number;
  nombre: string;
  correo: string;
  urlFoto: string | null;
};

export async function getCurrentSession(): Promise<SessionInfo> {
  const { data } = await apiClient.get<SessionInfo>('/api/auth/me');
  return data;
}

// Editar datos usuario
export async function editUserData(nombre?: string, telefono?: string, fotoUri?: string | null): Promise<void> {
  const body = new FormData();
  body.append("nombre", nombre ?? "");
  body.append("telefono", telefono ?? "");

  if (fotoUri) {
    const ext = fotoUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    body.append("foto", { uri: fotoUri, type, name: `profile.${ext}` } as unknown as Blob);
  }

  try {
    await apiClient.patch("/api/local/editar", body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        throw new Error("Tu sesión expiró." );
      }
    }
    throw new Error(
      "No se pudo editar el usuario. Intentalo nuevamente."
    );
  }
}