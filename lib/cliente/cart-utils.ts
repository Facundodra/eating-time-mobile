import type { Cart } from './types';

export function getActiveCartItems(cart: Cart | null) {
  return cart?.items.filter((i) => i.eliminacion == null) ?? [];
}

/** Carrito vigente: EN_CARRITO, no eliminado y con ítems activos. */
export function isActiveCart(cart: Cart | null): cart is Cart {
  if (!cart || cart.eliminacion != null) return false;
  if (cart.estado !== 'EN_CARRITO') return false;
  return getActiveCartItems(cart).length > 0;
}

export function getCartItemCount(cart: Cart | null) {
  if (!isActiveCart(cart)) return 0;
  return getActiveCartItems(cart).reduce((sum, i) => sum + i.cantidad, 0);
}

export function getCartsTotalItemCount(carts: Cart[]) {
  return carts.reduce((sum, cart) => sum + getCartItemCount(cart), 0);
}
