import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, usePathname } from 'expo-router';

import { subscribePendingOrdersRefresh } from '@/lib/cliente/pending-orders-refresh';
import { useAuth } from '@/hooks/use-auth';
import { getPendingConfirmationOrdersCount } from '@/services/cliente/cliente-service';

export function usePendingOrdersCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }

    getPendingConfirmationOrdersCount()
      .then(setCount)
      .catch(() => setCount(0));
  }, [user]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => refresh(), [refresh, pathname]);

  useEffect(() => subscribePendingOrdersRefresh(refresh), [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
