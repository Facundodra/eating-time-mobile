import type { Cart } from './types';

export function getActiveCartItems(cart: Cart | null) {
  return cart?.items.filter((i) => i.eliminacion == null) ?? [];
}

export function getCartItemCount(cart: Cart | null) {
  return getActiveCartItems(cart).reduce((sum, i) => sum + i.cantidad, 0);
}

export function getCartsTotalItemCount(carts: Cart[]) {
  return carts.reduce((sum, cart) => sum + getCartItemCount(cart), 0);
}
