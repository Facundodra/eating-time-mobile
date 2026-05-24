export type ClienteDto = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  fotoPerfil?: string;
};

export type PuntoDeEntregaDto = {
  id: string;
  alias: string;
  direccion: string;
  ciudad: string;
  piso?: string;
  departamento?: string;
};
