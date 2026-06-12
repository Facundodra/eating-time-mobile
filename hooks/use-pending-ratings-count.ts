import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, usePathname } from 'expo-router';

import { subscribeOrderRatingRefresh } from '@/lib/cliente/order-rating-refresh';
import { useAuth } from '@/hooks/use-auth';
import { getPendingOrderRatingsCount } from '@/services/cliente/cliente-service';

export function usePendingRatingsCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }

    getPendingOrderRatingsCount()
      .then(setCount)
      .catch(() => setCount(0));
  }, [user]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => refresh(), [refresh, pathname]);

  useEffect(() => subscribeOrderRatingRefresh(refresh), [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
