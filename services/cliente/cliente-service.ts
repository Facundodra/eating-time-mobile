import axios from 'axios';

import type { ClienteDto, LocalDto, LocalesParams, Page, PuntoDeEntrega, PuntoEntregaCredentials } from '@/lib/cliente/types';
import { apiClient } from '../api-client';

async function getCliente(id: string): Promise<ClienteDto> {
  const { data } = await apiClient.get<ClienteDto>(`/clientes/${id}`);
  return data;
}

async function getPuntosEntrega(clienteId: string): Promise<PuntoDeEntrega[]> {
  const { data } = await apiClient.get<PuntoDeEntrega[]>(`/api/clientes/${clienteId}/puntos-entrega`);
  return data;
}

async function addPuntoEntrega(clienteId: string, credentials: PuntoEntregaCredentials): Promise<void> {
  try {
    await apiClient.post(`/api/clientes/${clienteId}/puntos-entrega`, credentials);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const message = data?.error ?? data?.message ?? 'Error al guardar el punto de entrega';
      throw new Error(message);
    }
    throw new Error('Error al guardar el punto de entrega');
  }
}

export const puntoEntregaService = { getCliente, getPuntosEntrega, addPuntoEntrega };

export async function getLocales(params?: LocalesParams): Promise<Page<LocalDto>> {
  const { data } = await apiClient.get<Page<LocalDto>>('/api/locales', { params });
  return data;
}