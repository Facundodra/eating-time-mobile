import axios from 'axios';

import type { OrderClaim, OrderClaimStatus } from '@/lib/cliente/types';
import { requireClienteId } from '@/lib/cliente/require-session';

import { apiClient } from '../api-client';

export const MAX_COMPLAINT_NOTE_LENGTH = 300;

export type ClientClaimFilter = {
  pedidoId?: number;
  localId?: number;
  estado?: OrderClaimStatus;
  desde?: string;
  hasta?: string;
  ordenarPor?: 'estado' | 'fecha';
  direccion?: 'asc' | 'desc';
  page?: number;
  size?: number;
};

export type ClientClaimRestaurant = {
  id: number;
  name: string;
};

type ClaimApiResponse = {
  id: number;
  descripcion: string;
  nota?: string | null;
  estado: OrderClaimStatus;
  creacion: string;
  pedidoId: number;
  localId?: number | null;
  localNombre?: string | null;
  pedidoTotal?: number | null;
};

type ClaimPageApiResponse = {
  content: ClaimApiResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
};

type LocalApiResponse = {
  id: number;
  nombre: string;
};

function getClaimErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error?: string; message?: string; path?: string }
      | string
      | undefined;

    if (status === 404) {
      return 'Los reclamos no están disponibles en este servidor. Verificá que el backend tenga desplegada la API de reclamos.';
    }

    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      return data.error ?? data.message ?? fallback;
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function mapClaimFromApi(data: ClaimApiResponse): OrderClaim {
  return {
    id: data.id,
    pedidoId: data.pedidoId,
    descripcion: data.descripcion,
    nota: data.nota ?? null,
    estado: data.estado,
    creacion: data.creacion,
    localId: data.localId ?? undefined,
    localNombre: data.localNombre ?? null,
    pedidoTotal: data.pedidoTotal != null ? Number(data.pedidoTotal) : null,
  };
}

export async function getClientClaims(
  filter: ClientClaimFilter = {},
): Promise<{ claims: OrderClaim[]; totalPages: number; totalElements: number }> {
  const clienteId = await requireClienteId();
  const params: Record<string, string | number> = {};

  if (filter.pedidoId != null) params.pedidoId = filter.pedidoId;
  if (filter.localId != null) params.localId = filter.localId;
  if (filter.estado) params.estado = filter.estado;
  if (filter.desde) params.desde = filter.desde;
  if (filter.hasta) params.hasta = filter.hasta;
  if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
  if (filter.direccion) params.direccion = filter.direccion;
  params.page = filter.page ?? 0;
  params.size = filter.size ?? 10;

  try {
    const { data } = await apiClient.get<ClaimPageApiResponse>(
      `/api/reclamos/cliente/${clienteId}`,
      { params },
    );

    return {
      claims: data.content.map(mapClaimFromApi),
      totalPages: data.totalPages,
      totalElements: data.totalElements,
    };
  } catch (error) {
    throw new Error(getClaimErrorMessage(error, 'No se pudieron cargar tus reclamos.'));
  }
}

export async function getPendingClaimsCount(): Promise<number> {
  try {
    const { totalElements } = await getClientClaims({
      estado: 'PENDIENTE',
      page: 0,
      size: 1,
      ordenarPor: 'estado',
      direccion: 'desc',
    });
    return totalElements;
  } catch {
    return 0;
  }
}

export async function getClientClaimRestaurants(): Promise<ClientClaimRestaurant[]> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<LocalApiResponse[]>(
      `/api/reclamos/cliente/${clienteId}/locales`,
    );

    return data.map((local) => ({
      id: local.id,
      name: local.nombre,
    }));
  } catch (error) {
    throw new Error(getClaimErrorMessage(error, 'No se pudieron cargar los locales.'));
  }
}

export async function getOrderClaim(orderId: number): Promise<OrderClaim | null> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<ClaimApiResponse>(
      `/api/reclamos/cliente/${clienteId}/pedidos/${orderId}/reclamo`,
    );

    return mapClaimFromApi(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw new Error(getClaimErrorMessage(error, 'No se pudo cargar el reclamo del pedido.'));
  }
}

export async function submitOrderClaim(
  orderId: number,
  nota: string,
): Promise<OrderClaim> {
  const clienteId = await requireClienteId();
  const trimmedNota = nota.trim();

  if (!trimmedNota) {
    throw new Error('El motivo del reclamo es obligatorio.');
  }

  if (trimmedNota.length > MAX_COMPLAINT_NOTE_LENGTH) {
    throw new Error(
      `El motivo del reclamo no puede superar los ${MAX_COMPLAINT_NOTE_LENGTH} caracteres.`,
    );
  }

  try {
    const { data } = await apiClient.post<ClaimApiResponse>(
      `/api/reclamos/cliente/${clienteId}/pedidos/${orderId}/reclamo`,
      { nota: trimmedNota },
    );

    return mapClaimFromApi(data);
  } catch (error) {
    throw new Error(getClaimErrorMessage(error, 'No se pudo enviar el reclamo. Intentalo nuevamente.'));
  }
}

export async function loadOrderClaimsByOrderId(
  orderIds: number[],
): Promise<Record<number, OrderClaim>> {
  if (orderIds.length === 0) return {};

  const results = await Promise.all(
    orderIds.map(async (orderId) => {
      try {
        const claim = await getOrderClaim(orderId);
        return claim ? ([orderId, claim] as const) : null;
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(
    results.filter((entry): entry is readonly [number, OrderClaim] => entry != null),
  );
}
