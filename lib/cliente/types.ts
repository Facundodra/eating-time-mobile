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

export type Discount = {
  id: number;
  porcentaje: number;
  estado: boolean;
};

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
}

export type PedidoEstado =
  | 'EN_CARRITO'
  | 'ETAPA_DE_PAGO'
  | 'PENDIENTE_CONFIRMACION_LOCAL'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type PlatoPedidoDto = {
  id: number;
  platoId: number;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  total: number;
};

export type PedidoDto = {
  id: number;
  clienteId: number;
  localId: number;
  localNombre: string;
  estado: PedidoEstado;
  total: number;
  items: PlatoPedidoDto[];
  tieneCalificacionLocal: boolean;
  creacion: string;
  direccion: string | null;
  indicaciones: string | null;
};

export type CalificacionLocalRequestDto = {
  calificacion: string;
  comentario?: string;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};