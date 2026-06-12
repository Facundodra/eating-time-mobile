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

export type OrderStatus = 'EN_CARRITO' | 'ETAPA_DE_PAGO' | 'PENDIENTE_CONFIRMACION_LOCAL';

export type OrderRequest =
  | { puntoDeEntregaId: number }
  | {
      localidad: string;
      calle: string;
      numero: string;
      nroApto?: string;
      indicaciones?: string;
      guardarEnCuenta?: boolean;
    };

export type PaymentResponse = {
  linkPago: string;
};

export type PaymentStatus = 'approved' | 'failure' | 'pending';

export type CartItem = {
  id: number;
  pedidoId: number;
  platoId: number;
  nombre?: string;
  descuentoId: number | null;
  cantidad: number;
  costoUnitario: number;
  descuentoAplicado: number;
  total: number;
  creacion: string;
  eliminacion: string | null;
};

export type Cart = {
  id: number;
  restaurantId: number;
  clienteId: number;
  cuponId: number | null;
  estado: OrderStatus;
  total: number;
  descuento: number | null;
  tiempoEstimado: number | null;
  urlFactura: string | null;
  comentario: string | null;
  direccion: string | null;
  indicaciones: string | null;
  motivoRechazo: string | null;
  creacion: string;
  eliminacion: string | null;
  items: CartItem[];
};

// Calificacion de local 
export type LocalRating = {
  id: number;
  calificacion: number;
  comentario: string | null;
  creacion: string;
  pedidoId: number;
  nombreCliente: string;
};

export type OrderRatingValue =
  | '1_ESTRELLA'
  | '2_ESTRELLAS'
  | '3_ESTRELLAS'
  | '4_ESTRELLAS'
  | '5_ESTRELLAS';

export type OrderRating = {
  id?: number;
  pedidoId: number;
  calificacion: OrderRatingValue | string;
  comentario: string | null;
  creacion?: string | null;
};

export type OrderHistoryStatus =
  | 'PENDIENTE_CONFIRMACION_LOCAL'
  | 'ACEPTADO_LOCAL'
  | 'EN_CURSO_LOCAL'
  | 'EN_CAMINO_LOCAL'
  | 'FINALIZADO'
  | 'RECHAZADO_LOCAL'
  | 'CANCELADO_CLIENTE';

export type Order = {
  id: number;
  restaurantId: number;
  clienteId: number;
  cuponId: number | null;
  estado: OrderHistoryStatus;
  total: number;
  descuento: number | null;
  tiempoEstimado: string | null;
  urlFactura: string | null;
  comentario: string | null;
  direccion: string | null;
  indicaciones: string | null;
  motivoRechazo: string | null;
  creacion: string;
  eliminacion: string | null;
  items: CartItem[];
  calificacionLocal: OrderRating | null;
  hasLocalRating: boolean;
};