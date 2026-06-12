import { getSession } from '@/lib/auth/session';

export async function requireClienteId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.roleId) {
    throw new Error('Sesión no encontrada');
  }
  return session.user.roleId;
}
