import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { formatOrderDate, formatOrderPrice } from '@/lib/cliente/order-utils';
import type { Order } from '@/lib/cliente/types';

import OrderStatusBadge from './order-status-badge';

type Props = {
  order: Order;
  restaurantName: string;
  loadingRating: boolean;
  isRated: boolean;
  onOpenDetail: () => void;
  onOpenRating: () => void;
};

export default function OrderHistoryCard({
  order,
  restaurantName,
  loadingRating,
  isRated,
  onOpenDetail,
  onOpenRating,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatOrderDate(order.creacion)}</Text>
          <Text style={styles.total}>{formatOrderPrice(order.total)}</Text>
        </View>
        <OrderStatusBadge status={order.estado} />
      </View>

      <Text style={styles.restaurant} numberOfLines={2}>{restaurantName}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {order.direccion?.trim() ? order.direccion : 'Sin dirección registrada'}
      </Text>

      <View style={styles.actions}>
        {order.estado === 'FINALIZADO' ? (
          <TouchableOpacity
            style={[styles.actionBtn, loadingRating && styles.actionBtnDisabled]}
            onPress={onOpenRating}
            disabled={loadingRating}
          >
            <Text style={styles.actionBtnText}>
              {loadingRating ? 'Cargando...' : isRated ? 'Ver calificación' : 'Calificar'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionPlaceholder} />
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenDetail}>
          <Text style={styles.actionBtnText}>Ver detalles</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.orderId}>
        Pedido <Text style={styles.orderIdBold}>#{order.id}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.black,
  },
  total: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
  },
  restaurant: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.gray800,
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionPlaceholder: {
    flex: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  orderId: {
    marginTop: 10,
    fontSize: 11,
    color: Brand.gray400,
    textAlign: 'right',
  },
  orderIdBold: {
    fontWeight: '700',
    color: Brand.gray600,
  },
});
