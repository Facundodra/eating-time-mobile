export type AuthUser = {
  id: string;
  roleId?: string;
  name: string;
  email: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
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
  token: string;
  idUsuario: number;
  nombre: string;
  email: string;
};
