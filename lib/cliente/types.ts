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
