type ClaimRefreshListener = () => void;

const listeners = new Set<ClaimRefreshListener>();

export function subscribeClaimRefresh(listener: ClaimRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyClaimRefresh(): void {
  listeners.forEach((listener) => listener());
}
