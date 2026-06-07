export type ClienteDto = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  fotoPerfil?: string;
};

export type DeliveryPoint = {
  id: number;
  localidad: string;
  calle: string;
  numero: string;
  nroApto: string | null;
  indicaciones: string | null;
  creacion: string;
  clienteId: number;
};

export type DeliveryPointCredentials = {
  loc: string;
  street: string;
  number: string;
  apto?: string;
  indications?: string;
};

export type DishStatus = "available" | "unavailable";

export type ClientDish = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  status: DishStatus;
  createdAt: string;
  localId: number;
  categories: number[];
}

export type RestaurantList = {
  id: number;
  name: string;
  url_photo: string;
  stars: number;
  state: boolean;
}

export type Restaurant ={
  id: number;
  name: string;
  url_photo: string;
  stars: number;
  state: boolean;
  address: string | null;
  description: string | null;
}