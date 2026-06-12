import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, usePathname } from 'expo-router';

import { getCartsTotalItemCount } from '@/lib/cliente/cart-utils';
import { subscribeCartRefresh } from '@/lib/cliente/cart-refresh';
import { useAuth } from '@/hooks/use-auth';
import { getCarts } from '@/services/cliente/cliente-service';

export function useCartCount() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    getCarts()
      .then((carts) => setCartCount(getCartsTotalItemCount(carts)))
      .catch(() => setCartCount(0));
  }, [user]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => refresh(), [refresh, pathname]);

  useEffect(() => subscribeCartRefresh(refresh), [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return cartCount;
}
