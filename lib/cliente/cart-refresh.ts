type CartRefreshListener = () => void;

const listeners = new Set<CartRefreshListener>();

export function subscribeCartRefresh(listener: CartRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyCartRefresh(): void {
  listeners.forEach((listener) => listener());
}
