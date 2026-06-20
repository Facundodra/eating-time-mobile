import axios from 'axios';

import type { OrderClaim, Voucher } from '@/lib/cliente/types';
import { requireClienteId } from '@/lib/cliente/require-session';

import { apiClient } from '../api-client';
import { getClientClaims } from './claim-service';

type VoucherApiResponse = {
  id: number;
  codigo: string;
  descripcion: string | null;
  valor: number;
  creacion: string;
  vencimiento: string | null;
  reclamoId: number;
  pedidoId: number | null;
};

function getWalletErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { error?: string; message?: string }
    | string
    | undefined;

  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    return data.error ?? data.message ?? fallback;
  }
  return fallback;
}

function mapVoucher(voucher: VoucherApiResponse, claim?: OrderClaim): Voucher {
  return {
    id: String(voucher.id),
    code: voucher.codigo,
    description: voucher.descripcion ?? `Compensación por reclamo #${voucher.reclamoId}`,
    amount: voucher.valor,
    createdAt: voucher.creacion,
    expiresAt: voucher.vencimiento,
    claimId: voucher.reclamoId,
    orderId: voucher.pedidoId,
    restaurantName: claim?.localNombre ?? null,
    status: voucher.pedidoId == null ? 'disponible' : 'aplicado',
  };
}

async function getApprovedClaimsById(): Promise<Map<number, OrderClaim>> {
  const claimsById = new Map<number, OrderClaim>();
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getClientClaims({
      estado: 'APROBADO',
      ordenarPor: 'fecha',
      direccion: 'desc',
      page,
      size: 100,
    });

    result.claims.forEach((claim) => claimsById.set(claim.id, claim));
    totalPages = result.totalPages;
    page += 1;
  }

  return claimsById;
}

export async function getVouchers(): Promise<Voucher[]> {
  const clienteId = await requireClienteId();

  try {
    const [voucherResponse, claimsById] = await Promise.all([
      apiClient.get<VoucherApiResponse[]>(`/api/clientes/${clienteId}/vouchers`),
      getApprovedClaimsById().catch(() => new Map<number, OrderClaim>()),
    ]);

    return voucherResponse.data.map((voucher) =>
      mapVoucher(voucher, claimsById.get(voucher.reclamoId)),
    );
  } catch (error) {
    throw new Error(getWalletErrorMessage(error, 'No se pudieron cargar tus vouchers.'));
  }
}

export async function getAvailableVouchers(restaurantId: number): Promise<Voucher[]> {
  const clienteId = await requireClienteId();

  try {
    const { data } = await apiClient.get<VoucherApiResponse[]>(
      `/api/clientes/${clienteId}/local/${restaurantId}/vouchers`,
    );
    return data.map((voucher) => mapVoucher(voucher));
  } catch (error) {
    throw new Error(
      getWalletErrorMessage(error, 'No se pudieron cargar los vouchers disponibles.'),
    );
  }
}
