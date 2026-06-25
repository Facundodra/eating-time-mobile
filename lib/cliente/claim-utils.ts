import type { OrderClaimStatus, OrderHistoryStatus } from '@/lib/cliente/types';
import type { ClientClaimFilter } from '@/services/cliente/claim-service';

export const MAX_COMPLAINT_NOTE_LENGTH = 300;

export const CLAIM_ELIGIBLE_STATUSES: OrderHistoryStatus[] = [
  'ACEPTADO_LOCAL',
  'EN_CURSO_LOCAL',
  'EN_CAMINO_LOCAL',
  'FINALIZADO',
];

export function isClaimEligible(status: OrderHistoryStatus) {
  return CLAIM_ELIGIBLE_STATUSES.includes(status);
}

export type ClaimSortKey = 'estado-desc' | 'fecha-desc' | 'fecha-asc';

export const claimSortLabels: Record<ClaimSortKey, string> = {
  'estado-desc': 'Estado: pendientes primero',
  'fecha-desc': 'Fecha: más recientes',
  'fecha-asc': 'Fecha: más antiguos',
};

export const claimSortMap: Record<
  ClaimSortKey,
  Pick<ClientClaimFilter, 'ordenarPor' | 'direccion'>
> = {
  'estado-desc': { ordenarPor: 'estado', direccion: 'desc' },
  'fecha-desc': { ordenarPor: 'fecha', direccion: 'desc' },
  'fecha-asc': { ordenarPor: 'fecha', direccion: 'asc' },
};

export const claimStatusLabels: Record<OrderClaimStatus, string> = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const claimStatusShortLabels: Record<OrderClaimStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const claimStatusColors: Record<OrderClaimStatus, { bg: string; text: string }> = {
  PENDIENTE: { bg: '#FEF3C7', text: '#92400E' },
  APROBADO: { bg: '#DCFCE7', text: '#166534' },
  RECHAZADO: { bg: '#FEE2E2', text: '#B91C1C' },
};

export const CLAIM_PAGE_SIZE = 10;

export function toStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function toEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
