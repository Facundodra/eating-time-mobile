import { StyleSheet, Text, View } from 'react-native';

import { statusColors, statusLabels } from '@/lib/cliente/order-utils';
import type { OrderHistoryStatus } from '@/lib/cliente/types';

export default function OrderStatusBadge({ status }: { status: OrderHistoryStatus }) {
  const colors = statusColors[status] ?? { bg: '#F3F4F6', text: '#4B5563' };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {statusLabels[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
