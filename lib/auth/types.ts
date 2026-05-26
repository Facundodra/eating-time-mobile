export type AuthUser = {
  id: string;
  roleId: string;
  role: 'CLIENTE';
  name: string;
  email: string;
};

export type AuthSession = {
  user: AuthUser;
  sessionId?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
  profile_pic?: string;
};

export type LoginMobileResponse = {
  tipoUsuario: 'CLIENTE';
  idUsuario: number;
  idTipoUsuario: number;
};
