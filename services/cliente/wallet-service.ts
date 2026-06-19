import type { Voucher } from '@/lib/cliente/types';

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 1,
    codigo: 'VCH-8K2N',
    descripcion: 'Voucher por reclamo aprobado',
    valor: 250,
    estado: 'DISPONIBLE',
    creacion: '2026-05-12T10:00:00',
    vencimiento: '2027-05-12T10:00:00',
    localId: 1,
    localNombre: 'Pizzería Don Mario',
  },
  {
    id: 2,
    codigo: 'VCH-3PQ7',
    descripcion: 'Voucher por reclamo aprobado',
    valor: 120,
    estado: 'DISPONIBLE',
    creacion: '2026-06-01T15:30:00',
    vencimiento: '2027-06-01T15:30:00',
    localId: 2,
    localNombre: 'Sushi Yama',
  },
  {
    id: 3,
    codigo: 'VCH-1A9X',
    descripcion: 'Voucher por reclamo aprobado',
    valor: 80,
    estado: 'USADO',
    creacion: '2026-02-20T09:15:00',
    vencimiento: '2027-02-20T09:15:00',
    localId: 1,
    localNombre: 'Pizzería Don Mario',
  },
  {
    id: 4,
    codigo: 'VCH-5M4D',
    descripcion: 'Voucher por reclamo aprobado',
    valor: 150,
    estado: 'VENCIDO',
    creacion: '2025-01-10T12:00:00',
    vencimiento: '2026-01-10T12:00:00',
    localId: 3,
    localNombre: 'Burger House',
  },
];

export async function getVouchers(): Promise<Voucher[]> {
  return MOCK_VOUCHERS;
}

type CouponDiscount = { tipo: 'PORCENTAJE' | 'MONTO'; valor: number };

const MOCK_COUPONS: Record<string, CouponDiscount> = {
  BIENVENIDO10: { tipo: 'PORCENTAJE', valor: 10 },
  DESCUENTO5: { tipo: 'MONTO', valor: 5 },
};

export function validateCoupon(code: string): CouponDiscount | null {
  return MOCK_COUPONS[code.trim().toUpperCase()] ?? null;
}
