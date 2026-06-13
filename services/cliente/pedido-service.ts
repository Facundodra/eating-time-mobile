import axios from 'axios';

import { requireClienteId } from '@/lib/cliente/require-session';
import type { CalificacionLocalRequestDto, Page, PedidoDto } from '@/lib/cliente/types';
import { apiClient } from '../api-client';

export type PedidoFilter = {
  identificador?: string;
  localId?: number;
  desde?: string;
  hasta?: string;
  ordenarPor?: string;
  direccion?: 'asc' | 'desc';
  page?: number;
  size?: number;
};

export async function getHistorial(filter: PedidoFilter = {}): Promise<Page<PedidoDto>> {
  const clienteId = await requireClienteId();
  try {
    const { data } = await apiClient.get<Page<PedidoDto>>(
      `/api/clientes/${clienteId}/pedidos`,
      { params: filter },
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al obtener pedidos';
      throw new Error(msg);
    }
    throw new Error('No se pudieron cargar los pedidos.');
  }
}

export async function cancelarPedido(pedidoId: number): Promise<void> {
  const clienteId = await requireClienteId();
  try {
    await apiClient.patch(`/api/clientes/${clienteId}/pedidos/${pedidoId}/cancelar`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al cancelar pedido';
      throw new Error(msg);
    }
    throw new Error('No se pudo cancelar el pedido.');
  }
}

export async function crearCalificacion(
  pedidoId: number,
  body: CalificacionLocalRequestDto,
): Promise<void> {
  try {
    await apiClient.post(`/api/pedidos/${pedidoId}/calificacion-local`, body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Error al calificar';
      throw new Error(msg);
    }
    throw new Error('No se pudo enviar la calificación.');
  }
}
