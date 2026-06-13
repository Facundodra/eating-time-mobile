import axios from 'axios';

import type {
    Cart,
    CartItem,
    ClientDish,
    ClienteDto,
    DeliveryPoint,
    DeliveryPointCredentials,
    Discount,
    LocalRating,
    Order,
    OrderHistoryStatus,
    OrderRating,
    OrderRatingValue,
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

export async function getPendingConfirmationOrders(): Promise<Order[]> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<PedidoDtoFromApi[]>(
      `/api/clientes/${clienteId}/pedidos/pendientes-confirmacion`,
    );
    return data.map(mapOrderFromApi);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = getApiErrorMessage(error.response?.data);

      if (status === 404) {
        throw new Error('Los pedidos pendientes de confirmación no están disponibles en el servidor.');
      }

      throw new Error(message ?? `Error al obtener pedidos pendientes (${status})`);
    }
    throw new Error('No se pudieron cargar los pedidos en curso.');
  }
}

export async function getPendingConfirmationOrdersCount(): Promise<number> {
  try {
    const orders = await getPendingConfirmationOrders();
    return orders.length;
  } catch {
    return 0;
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

// ── Historial de pedidos ────────────────────────────────────────────────────────

export type OrderHistoryFilter = {
    orderId?: number;
    localId?: number;
    desde?: string;
    hasta?: string;
    ordenarPor?: 'fecha' | 'precio';
    direccion?: 'asc' | 'desc';
    page?: number;
    size?: number;
    includeRatings?: boolean;
};

export type OrderHistoryRestaurant = {
    id: number;
    name: string;
};

export type SubmitOrderRatingRequest = {
    calificacion: OrderRatingValue;
    comentario?: string;
};

interface PedidoDtoFromApi {
    id: number;
    localId: number;
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
    items: CartItem[] | null;
    calificacionLocal?: unknown;
    localCalificacion?: unknown;
    tieneCalificacionLocal?: unknown;
    calificadoLocal?: unknown;
}

interface OrderRatingDtoFromApi {
    id?: number;
    pedidoId?: number;
    calificacion?: OrderRatingValue | string | null;
    comentario?: string | null;
    creacion?: string | null;
}

interface OrderHistoryPageResponse {
    content: PedidoDtoFromApi[];
    totalPages: number;
    totalElements: number;
    number: number;
}

interface LocalResumenDtoFromApi {
    id: number;
    nombre?: string;
    name?: string;
}

function mapLocalResumenDto(local: LocalResumenDtoFromApi): OrderHistoryRestaurant {
    return {
        id: local.id,
        name: local.nombre ?? local.name ?? `Local #${local.id}`,
    };
}

async function buildRestaurantsFromOrderHistory(): Promise<OrderHistoryRestaurant[]> {
    const localIds = new Set<number>();
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const { orders, totalPages: pages } = await getOrderHistory({
            page,
            size: 100,
            includeRatings: false,
        });

        totalPages = pages;
        orders.forEach((order) => localIds.add(order.restaurantId));
        page += 1;
    }

    if (localIds.size === 0) return [];

    const restaurants = await Promise.all(
        [...localIds].map(async (id) => {
            try {
                const name = await getRestaurantName(id);
                return { id, name };
            } catch {
                return { id, name: `Local #${id}` };
            }
        }),
    );

    return restaurants.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function mapOrderFromApi(dto: PedidoDtoFromApi): Order {
    const {
        localId,
        items,
        calificacionLocal,
        localCalificacion,
        tieneCalificacionLocal,
        calificadoLocal,
        ...rest
    } = dto;
    const rating = mapOrderRatingFromApi(
        calificacionLocal ?? localCalificacion ?? null,
        dto.id,
    );

    return {
        ...rest,
        restaurantId: localId,
        items: items ?? [],
        calificacionLocal: rating,
        hasLocalRating:
            Boolean(rating) ||
            hasOrderRatingFromApi(
                calificacionLocal,
                localCalificacion,
                tieneCalificacionLocal,
                calificadoLocal,
            ),
    };
}

function mapOrderRatingFromApi(rating: unknown, orderId: number): OrderRating | null {
    if (!rating) return null;

    if (typeof rating === 'string' || typeof rating === 'number') {
        const calificacion = normalizeRatingValue(rating);
        if (!calificacion) return null;

        return {
            pedidoId: orderId,
            calificacion,
            comentario: null,
            creacion: null,
        };
    }

    if (typeof rating !== 'object') return null;

    const record = rating as Record<string, unknown>;
    const nestedRating =
        record.calificacionLocal ??
        record.localCalificacion ??
        record.rating ??
        record.data;

    if (nestedRating && nestedRating !== rating) {
        const mappedNestedRating = mapOrderRatingFromApi(nestedRating, orderId);
        if (mappedNestedRating) return mappedNestedRating;
    }

    const calificacion = normalizeRatingValue(record.calificacion);
    if (!calificacion) return null;

    return {
        id: typeof record.id === 'number' ? record.id : undefined,
        pedidoId: typeof record.pedidoId === 'number' ? record.pedidoId : orderId,
        calificacion,
        comentario: typeof record.comentario === 'string' ? record.comentario : null,
        creacion: typeof record.creacion === 'string' ? record.creacion : null,
    };
}

function normalizeRatingValue(value: unknown): string | null {
    if (typeof value === 'string') {
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
        return value === 1 ? '1_ESTRELLA' : `${value}_ESTRELLAS`;
    }

    return null;
}

function hasOrderRatingFromApi(...values: unknown[]): boolean {
    return values.some((value) => {
        if (value == null) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;

        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            return normalized !== '' && normalized !== 'false' && normalized !== '0';
        }

        if (typeof value !== 'object') return false;

        const record = value as Record<string, unknown>;
        return (
            Boolean(normalizeRatingValue(record.calificacion)) ||
            hasOrderRatingFromApi(
                record.id,
                record.pedidoId,
                record.calificacionLocal,
                record.localCalificacion,
                record.calificadoLocal,
                record.tieneCalificacionLocal,
                record.rating,
                record.data,
            )
        );
    });
}

async function fetchOrderLocalRating(orderId: number): Promise<OrderRating | null> {
    try {
        const { data } = await apiClient.get<unknown>(`/api/pedidos/${orderId}/calificacion-local`);
        return mapOrderRatingFromApi(data, orderId);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404 || status === 405) return null;

            const responseData = error.response?.data as { error?: string; message?: string } | string | undefined;
            const message =
                typeof responseData === 'string'
                    ? responseData
                    : responseData?.error ?? responseData?.message ?? `Error al obtener calificacion (${status})`;
            throw new Error(message);
        }
        throw new Error('No se pudo cargar la calificacion del pedido.');
    }
}

async function hydrateOrdersWithLocalRatings(orders: Order[]): Promise<Order[]> {
    const ordersToHydrate = orders.filter(
        (order) => order.estado === 'FINALIZADO' && !order.hasLocalRating,
    );

    if (ordersToHydrate.length === 0) return orders;

    const ratingResults = await Promise.all(
        ordersToHydrate.map(async (order) => ({
            orderId: order.id,
            rating: await fetchOrderLocalRating(order.id).catch(() => null),
        })),
    );

    const ratingsByOrderId = new Map(
        ratingResults
            .filter((result): result is { orderId: number; rating: OrderRating } => Boolean(result.rating))
            .map((result) => [result.orderId, result.rating]),
    );

    if (ratingsByOrderId.size === 0) return orders;

    return orders.map((order) => {
        const rating = ratingsByOrderId.get(order.id);
        return rating
            ? { ...order, calificacionLocal: rating, hasLocalRating: true }
            : order;
    });
}

function parseRatingValueToNumber(value: OrderRatingValue | string): number | null {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
        return value;
    }

    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    const match = normalized.match(/^([1-5])(?:_|$)/);
    return match ? Number(match[1]) : null;
}

export async function getOrderHistory(
    filter: OrderHistoryFilter = {},
): Promise<{ orders: Order[]; totalPages: number; totalElements: number }> {
    const clienteId = await requireClienteId();

    const params: Record<string, string | number> = {};
    if (filter.orderId != null) params.identificador = filter.orderId;
    if (filter.localId != null) params.localId = filter.localId;
    if (filter.desde) params.desde = filter.desde;
    if (filter.hasta) params.hasta = filter.hasta;
    if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
    if (filter.direccion) params.direccion = filter.direccion;
    params.page = filter.page ?? 0;
    params.size = filter.size ?? 10;

    try {
        const { data } = await apiClient.get<OrderHistoryPageResponse>(
            `/api/clientes/${clienteId}/pedidos`,
            { params },
        );
        const mappedOrders = data.content.map(mapOrderFromApi);
        const orders = filter.includeRatings === false
            ? mappedOrders
            : await hydrateOrdersWithLocalRatings(mappedOrders);

        return {
            orders,
            totalPages: data.totalPages,
            totalElements: data.totalElements,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const responseData = error.response?.data as { error?: string; message?: string } | string | undefined;

            if (status === 404) {
                throw new Error('El historial de pedidos no está disponible en el servidor.');
            }

            const message =
                typeof responseData === 'string'
                    ? responseData
                    : responseData?.error ?? responseData?.message ?? `Error al obtener pedidos (${status})`;
            throw new Error(message);
        }
        throw new Error('No se pudieron cargar los pedidos.');
    }
}

export async function getOrderHistoryRestaurants(): Promise<OrderHistoryRestaurant[]> {
    const clienteId = await requireClienteId();

    try {
        const { data } = await apiClient.get<LocalResumenDtoFromApi[]>(
            `/api/clientes/${clienteId}/pedidos/locales`,
        );

        if (!Array.isArray(data)) {
            return buildRestaurantsFromOrderHistory();
        }

        const mapped = data.map(mapLocalResumenDto);
        if (mapped.length > 0) {
            return mapped.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        }

        return buildRestaurantsFromOrderHistory();
    } catch {
        return buildRestaurantsFromOrderHistory();
    }
}

export async function getPendingOrderRatingsCount(): Promise<number> {
    const orders = await getUnratedFinishedOrders();
    return orders.length;
}

export async function getUnratedFinishedOrders(): Promise<Order[]> {
    let page = 0;
    let totalPages = 1;
    const orders: Order[] = [];

    while (page < totalPages) {
        const { orders: batch, totalPages: pages } = await getOrderHistory({
            page,
            size: 100,
            ordenarPor: 'fecha',
            direccion: 'desc',
        });

        totalPages = pages;
        orders.push(
            ...batch.filter(
                (order) => order.estado === 'FINALIZADO' && !order.hasLocalRating && !order.calificacionLocal,
            ),
        );
        page += 1;
    }

    return orders;
}

export async function getOrderLocalRating(orderId: number): Promise<OrderRating | null> {
    await requireClienteId();
    return fetchOrderLocalRating(orderId);
}

export async function submitOrderLocalRating(
    orderId: number,
    request: SubmitOrderRatingRequest,
): Promise<OrderRating> {
    await requireClienteId();
    const ratingNumber = parseRatingValueToNumber(request.calificacion);

    if (ratingNumber == null) {
        throw new Error('La calificación debe ser un número entre 1 y 5.');
    }

    const body = {
        calificacion: String(ratingNumber),
        comentario: request.comentario?.trim() || null,
    };

    try {
        const { data } = await apiClient.post<OrderRatingDtoFromApi>(
            `/api/pedidos/${orderId}/calificacion-local`,
            body,
        );

        return mapOrderRatingFromApi(data, orderId) ?? {
            pedidoId: orderId,
            calificacion: request.calificacion,
            comentario: body.comentario,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const responseData = error.response?.data as { error?: string; message?: string } | string | undefined;
            const message =
                typeof responseData === 'string'
                    ? responseData
                    : responseData?.error ?? responseData?.message ?? `Error al calificar pedido (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error('No se pudo registrar la calificacion del pedido.');
    }
}

export class CancelOrderError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly notCancelable = false,
    ) {
        super(message);
        this.name = 'CancelOrderError';
    }
}

export async function cancelOrder(pedidoId: number): Promise<Order> {
    const clienteId = await requireClienteId();

    try {
        const { data } = await apiClient.patch<PedidoDtoFromApi>(
            `/api/clientes/${clienteId}/pedidos/${pedidoId}/cancelar`,
        );
        return mapOrderFromApi(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = getApiErrorMessage(error.response?.data);

            if (status === 409) {
                throw new CancelOrderError('Tu pedido ya no es cancelable.', 409, true);
            }
            if (status === 404) {
                throw new CancelOrderError(message ?? 'Pedido no encontrado.', 404);
            }
            if (status === 403) {
                throw new CancelOrderError(
                    message ?? 'No tenés permiso para cancelar este pedido.',
                    403,
                );
            }
            throw new CancelOrderError(
                message ?? 'No se pudo cancelar el pedido. Intentalo nuevamente.',
                status,
            );
        }
        throw new CancelOrderError('No se pudo cancelar el pedido. Intentalo nuevamente.');
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

function getApiErrorMessage(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') return undefined;

    const payload = data as Record<string, unknown>;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.error === 'string') return payload.error;
    if (typeof payload.detail === 'string') return payload.detail;
    return undefined;
}

export class AccountDeletionError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly hasPendingOrders = false,
    ) {
        super(message);
        this.name = 'AccountDeletionError';
    }
}

export async function deleteClientAccount(): Promise<void> {
    const clienteId = await requireClienteId();

    try {
        await apiClient.delete(`/api/clientes/${clienteId}/cuenta`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = getApiErrorMessage(error.response?.data);

            if (status === 403) {
                throw new AccountDeletionError(
                    message ?? 'No tenés permiso para eliminar esta cuenta.',
                    403,
                );
            }
            if (status === 404) {
                throw new AccountDeletionError(message ?? 'Cuenta no encontrada.', 404);
            }
            if (status === 409) {
                throw new AccountDeletionError(
                    message ?? 'No podés eliminar la cuenta en este momento.',
                    409,
                    true,
                );
            }
            throw new AccountDeletionError(
                message ?? `Error al eliminar la cuenta (${status})`,
                status,
            );
        }
        throw new AccountDeletionError('No se pudo eliminar la cuenta. Intentalo nuevamente.');
    }
}