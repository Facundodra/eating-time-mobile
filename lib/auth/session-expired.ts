type SessionExpiredHandler = () => void | Promise<void>;

let handler: SessionExpiredHandler | null = null;
let handling = false;

export function registerSessionExpiredHandler(next: SessionExpiredHandler | null) {
  handler = next;
}

export async function notifySessionExpired() {
  if (handling || !handler) return;

  handling = true;
  try {
    await handler();
  } finally {
    handling = false;
  }
}
