import type { OrderHistoryStatus } from '@/lib/cliente/types';

export const ORDER_PAGE_SIZE = 10;

export type SortKey = 'fecha-desc' | 'fecha-asc';

export const sortMap: Record<SortKey, { ordenarPor: 'fecha'; direccion: 'asc' | 'desc' }> = {
  'fecha-desc': { ordenarPor: 'fecha', direccion: 'desc' },
  'fecha-asc': { ordenarPor: 'fecha', direccion: 'asc' },
};

export const sortLabels: Record<SortKey, string> = {
  'fecha-desc': 'Fecha: más recientes',
  'fecha-asc': 'Fecha: más antiguos',
};

export const statusLabels: Record<OrderHistoryStatus, string> = {
  PENDIENTE_CONFIRMACION_LOCAL: 'Esperando al local',
  ACEPTADO_LOCAL: 'Aceptado',
  EN_CURSO_LOCAL: 'En preparación',
  EN_CAMINO_LOCAL: 'En camino',
  FINALIZADO: 'Finalizado',
  RECHAZADO_LOCAL: 'Rechazado',
  CANCELADO_CLIENTE: 'Cancelado',
};

export const statusColors: Record<OrderHistoryStatus, { bg: string; text: string }> = {
  PENDIENTE_CONFIRMACION_LOCAL: { bg: '#F3E8FF', text: '#6B21A8' },
  ACEPTADO_LOCAL: { bg: '#DBEAFE', text: '#1D4ED8' },
  EN_CURSO_LOCAL: { bg: '#FEF3C7', text: '#B45309' },
  EN_CAMINO_LOCAL: { bg: '#E0E7FF', text: '#4338CA' },
  FINALIZADO: { bg: '#D1FAE5', text: '#065F46' },
  RECHAZADO_LOCAL: { bg: '#FEE2E2', text: '#B91C1C' },
  CANCELADO_CLIENTE: { bg: '#E5E7EB', text: '#4B5563' },
};

export function formatOrderDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatOrderPrice(price: number | null | undefined) {
  if (price == null) return '-';
  return `$${price.toLocaleString('es-UY')}`;
}

export function toStartOfDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00`;
}

export function toEndOfDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T23:59:59`;
}

export function formatDatePickerLabel(date: Date | null) {
  if (!date) return 'Seleccionar';
  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
