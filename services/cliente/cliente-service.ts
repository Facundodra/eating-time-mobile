import { apiClient } from '../api-client';
import type { ClienteDto } from '@/lib/cliente/types';

async function getCliente(id: string): Promise<ClienteDto> {
  const { data } = await apiClient.get<ClienteDto>(`/clientes/${id}`);
  return data;
}

export const clienteService = { getCliente };
