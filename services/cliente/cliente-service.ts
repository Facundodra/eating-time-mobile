import axios from 'axios';

import type {
    Cart,
    ClientDish,
    ClienteDto,
    DeliveryPoint,
    DeliveryPointCredentials,
    Discount,
    LocalRating,
    OrderRequest,
    PaymentResponse,
    Restaurant,
    RestaurantList,
} from '@/lib/cliente/types';

import { requireClienteId } from '@/lib/cliente/require-session';
import { apiClient } from '../api-client';

async function getCliente(id: string): Promise<ClienteDto> {
  const { data } = await apiClient.get<ClienteDto>(`/api/clientes/${id}`);
  return data;
}

async function getDeliveryPoints(clienteId: string): Promise<DeliveryPoint[]> {
  const { data } = await apiClient.get<DeliveryPoint[]>(`/api/clientes/${clienteId}/puntos-entrega`);
  return data;
}

async function addDeliveryPoint(clienteId: string, credentials: DeliveryPointCredentials): Promise<void> {
  const body: Record<string, string> = {
    localidad: credentials.loc,
    calle: credentials.street,
    numero: credentials.number,
    ...(credentials.apto        && { nroApto:      credentials.apto }),
    ...(credentials.indications && { indicaciones: credentials.indications }),
  };
  try {
    await apiClient.post(`/api/clientes/${clienteId}/puntos-entrega`, body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const message = data?.error ?? data?.message ?? 'Error al guardar el punto de entrega';
      throw new Error(message);
    }
    throw new Error('Error al guardar el punto de entrega');
  }
}

export const deliveryPointService = { getCliente, getDeliveryPoints, addDeliveryPoint };



// Listado de locales
// export async function getLocales(params?: LocalesParams): Promise<Page<LocalDto>> {
//   const { data } = await apiClient.get<Page<LocalDto>>('/api/locales', { params });
//   return data;
// }

// Listado de locales
export type RestaurantFilter = {
    nombre?: string;
    calificacionMin?: number;
    calificacionMax?: number;
    servicio?: 'ACTIVO' | 'INACTIVO';
    ordenarPor?: 'calificacion' | 'nombre';
    direccion?: 'asc' | 'desc';
    page?: number;
    size?: number;
};

interface RestaurantDtoFromApi {
    id: number;
    nombre: string;
    urlFoto: string | null;
    estadoServicio: boolean;
    calificacion: number | null;
}

interface RestaurantPageResponse {
    content: RestaurantDtoFromApi[];
    totalPages: number;
}

function mapRestaurantDtoApiToRestaurantType(r: RestaurantDtoFromApi): RestaurantList {
    return {
        id: r.id,
        name: r.nombre,
        url_photo: r.urlFoto ?? "",
        stars: r.calificacion ?? 0,
        state: r.estadoServicio,
    };
}



export async function getRestaurants(
    filter: RestaurantFilter = {}
): Promise<{ restaurants: RestaurantList[]; totalPages: number }> {
    await requireClienteId();

    try {
        const response = await apiClient.get<RestaurantPageResponse>(`/api/locales`, { params: filter });
        return {
            restaurants: response.data.content.map(mapRestaurantDtoApiToRestaurantType),
            totalPages: response.data.totalPages,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener locales (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los locales.");
    }
}



interface RestaurantSingleDtoFromApi {
    id: number;
    nombre: string;
    urlFoto: string | null;
    estadoServicio: boolean;
    calificacion: number | null;
    direccion: string | null;
    descripcion: string | null;
}

function mapRestaurantDtoApiToRestaurant(r: RestaurantSingleDtoFromApi): Restaurant {
    return {
        id: r.id,
        name: r.nombre,
        url_photo: r.urlFoto ?? "",
        stars: r.calificacion ?? 0,
        state: r.estadoServicio,
        address : r.direccion,
        description: r.descripcion
    };
}


export async function getRestaurantName(id: number): Promise<string> {
    const restaurant = await getRestaurant(String(id));
    return restaurant.name;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
    await requireClienteId();

    try {
        const response = await apiClient.get<RestaurantSingleDtoFromApi>(`/api/locales/${id}`);
        return mapRestaurantDtoApiToRestaurant(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener local (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el local.");
    }
}



// Listado de platos 
interface PlatoDtoFromApi {
    id: number;
    nombre: string;
    fotoUrl: string | null;
    precio: number;
    disponible: boolean;
    creacion: string;
    localId: number;
    categoriaIds: number[] | null;
}

function mapPlatoToClientDish(plato: PlatoDtoFromApi): ClientDish {
    return {
        id: String(plato.id),
        name: plato.nombre,
        price: plato.precio,
        imageUrl: plato.fotoUrl,
        status: plato.disponible ? "available" : "unavailable",
        createdAt: plato.creacion,
        localId: plato.localId,
        categories: plato.categoriaIds ?? [],
    };
}


export type DishFilter = {
    idLocal?: number;
    precioMin?: number;
    precioMax?: number;
    conDescuento?: boolean;
    orden?: "precio";
    sentido?: "asc" | "desc";
    pagina?: number;
    tamano?: number;
};

export async function getDishes(filter?: DishFilter): Promise<ClientDish[]>{
    await requireClienteId();

    const params = new URLSearchParams();
    if (filter?.idLocal != null)    params.set("idLocal",      String(filter.idLocal));
    if (filter?.precioMin != null)  params.set("precioMin",    String(filter.precioMin));
    if (filter?.precioMax != null)  params.set("precioMax",    String(filter.precioMax));
    if (filter?.conDescuento)       params.set("conDescuento", "true");
    if (filter?.orden)              params.set("orden",        filter.orden);
    if (filter?.sentido)            params.set("sentido",      filter.sentido);
    if (filter?.pagina != null)     params.set("pagina",       String(filter.pagina));
    if (filter?.tamano != null)     params.set("tamano",       String(filter.tamano));

    const query = params.toString();
    const url = `/api/locales/platos${query ? `?${query}` : ""}`;

    try{
        const response = await apiClient.get<PlatoDtoFromApi[]>(url);
        return response.data.map(mapPlatoToClientDish);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener platos (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los platos.");
    }
}

export async function getDish(id: string): Promise<ClientDish> {
    await requireClienteId();

    try {
        const response = await apiClient.get<PlatoDtoFromApi>(`/api/platos/${id}`);
        return mapPlatoToClientDish(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener plato (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el plato.");
    }
}

export async function getDishDiscount(dishId: number): Promise<Discount | null> {
    await requireClienteId();

    try {
        const response = await apiClient.get<Discount>(`/api/descuentos/plato/${dishId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) return null;
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener descuento (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el descuento.");
    }
}

export async function getDiscountedDishIds(idLocal?: number): Promise<Set<number>> {
    const dishes = await getDishes({ idLocal, conDescuento: true, tamano: 100 });
    return new Set(dishes.map((dish) => Number(dish.id)));
}


// ── Carrito ────────────────────────────────────────────────────────────────────

type CartFromApi = Omit<Cart, 'restaurantId'> & { localId: number };

function mapCartFromApi(cart: CartFromApi): Cart {
  const { localId, ...rest } = cart;
  return { ...rest, restaurantId: localId };
}

export async function getCarts(): Promise<Cart[]> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<CartFromApi[]>(`/api/clientes/${clienteId}/carritos`);
    return data.map(mapCartFromApi);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al obtener carritos';
      throw new Error(msg);
    }
    throw new Error('No se pudieron cargar los carritos.');
  }
}

export async function getCart(restaurantId: number): Promise<Cart | null> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<CartFromApi>(`/api/clientes/${clienteId}/carritos/${restaurantId}`);
    return mapCartFromApi(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al obtener carrito';
      throw new Error(msg);
    }
    throw new Error('No se pudo cargar el carrito.');
  }
}

export async function updateCartItem(
  restaurantId: number,
  platoId: number,
  cantidad: number,
): Promise<Cart> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.post<CartFromApi>(
      `/api/clientes/${clienteId}/local/${restaurantId}/agregar-plato/${platoId}/cantidad/${cantidad}`,
    );
    return mapCartFromApi(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al actualizar carrito';
      throw new Error(msg);
    }
    throw new Error('No se pudo actualizar el carrito.');
  }
}

export async function deleteCart(restaurantId: number): Promise<void> {
  const clienteId = await requireClienteId();

  try {
    await apiClient.delete(`/api/clientes/${clienteId}/carritos/${restaurantId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al eliminar carrito';
      throw new Error(msg);
    }
    throw new Error('No se pudo eliminar el carrito.');
  }
}

export async function placeOrder(restaurantId: number, body: OrderRequest): Promise<PaymentResponse> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.patch<PaymentResponse>(
      `/api/clientes/${clienteId}/carritos/${restaurantId}`,
      { ...body, isMobile: true },
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al realizar pedido';
      throw new Error(msg);
    }
    throw new Error('No se pudo realizar el pedido.');
  }
}

export async function getPendingConfirmationOrders(): Promise<Cart[]> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<CartFromApi[]>(
      `/api/clientes/${clienteId}/pedidos/pendientes-confirmacion`,
    );
    return data.map(mapCartFromApi);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al verificar pedido';
      throw new Error(msg);
    }
    throw new Error('No se pudo verificar el estado del pedido.');
  }
}

export async function resolvePaymentStatus(
  pedidoId: number,
  localId: number,
): Promise<'approved' | 'failure' | 'pending'> {
  const pending = await getPendingConfirmationOrders();
  if (pending.some((p) => p.id === pedidoId)) {
    return 'approved';
  }

  const cart = await getCart(localId);

  // El pedido sigue EN_CARRITO: el callback de MP puede no haber corrido aún
  // (el usuario volvió a la app antes de que el backend procese el pago).
  if (cart && cart.id === pedidoId) {
    return 'pending';
  }

  // Ya no hay carrito activo para este local pero tampoco aparece en pendientes:
  // el callback puede estar en curso; seguir polling.
  if (!cart) {
    return 'pending';
  }

  return 'pending';
}

// ── Cuenta ─────────────────────────────────────────────────────────────────────

export async function eliminarCuenta(): Promise<void> {
  const clienteId = await requireClienteId();
  try {
    await apiClient.delete(`/api/clientes/${clienteId}/cuenta`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al eliminar la cuenta';
      throw new Error(msg);
    }
    throw new Error('No se pudo eliminar la cuenta.');
  }
}

// ── Calificaciones ─────────────────────────────────────────────────────────────
export async function getLocalRatings(restaurantId: number): Promise<LocalRating[]> {
    try {
        const response = await apiClient.get<LocalRating[]>(`/api/locales/${restaurantId}/comentarios`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener comentarios (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar los comentarios.");
    }
}