type OrderRatingRefreshListener = () => void;

const listeners = new Set<OrderRatingRefreshListener>();

export function subscribeOrderRatingRefresh(listener: OrderRatingRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyOrderRatingRefresh(): void {
  listeners.forEach((listener) => listener());
}
