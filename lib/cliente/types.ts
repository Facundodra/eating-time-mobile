export type ClienteDto = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  fotoPerfil?: string;
};

export type PuntoDeEntrega = {
  id: number;
  localidad: string;
  calle: string;
  numero: string;
  nroApto: string | null;
  indicaciones: string | null;
  creacion: string;
  clienteId: number;
};

export type PuntoEntregaCredentials = {
  localidad: string;
  calle: string;
  numero: string;
  nroApto?: string;
  indicaciones?: string;
};

export type LocalDto = {
  id: number;
  usuarioId: number;
  nombre: string;
  email: string;
  telefono: string;
  creacion: string;
  bloqueo: string | null;
  eliminacion: string | null;
  direccion: string;
  urlFoto: string | null;
  descripcion: string;
  calificacion: number;
  estadoServicio: boolean;
};

export type LocalesParams = {
  nombre?: string;
  calificacionMin?: number;
  calificacionMax?: number;
  servicio?: 'ACTIVO' | 'INACTIVO';
  ordenarPor?: 'calificacion' | 'nombre';
  direccion?: 'asc' | 'desc';
  page?: number;
  size?: number;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};