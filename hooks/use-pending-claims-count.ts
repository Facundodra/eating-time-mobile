import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, usePathname } from 'expo-router';

import { subscribeClaimRefresh } from '@/lib/cliente/claim-refresh';
import { useAuth } from '@/hooks/use-auth';
import { getPendingClaimsCount } from '@/services/cliente/claim-service';

export function usePendingClaimsCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }

    getPendingClaimsCount()
      .then(setCount)
      .catch(() => setCount(0));
  }, [user]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => refresh(), [refresh, pathname]);

  useEffect(() => subscribeClaimRefresh(refresh), [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return count;
}
