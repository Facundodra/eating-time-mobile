type PendingOrdersRefreshListener = () => void;

const listeners = new Set<PendingOrdersRefreshListener>();

export function subscribePendingOrdersRefresh(listener: PendingOrdersRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPendingOrdersRefresh(): void {
  listeners.forEach((listener) => listener());
}
