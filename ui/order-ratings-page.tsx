import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon, HandThumbUpIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderDate, formatOrderPrice } from '@/lib/cliente/order-utils';
import { notifyOrderRatingRefresh } from '@/lib/cliente/order-rating-refresh';
import type { Order, OrderRating } from '@/lib/cliente/types';
import {
  getRestaurantName,
  getUnratedFinishedOrders,
} from '@/services/cliente/cliente-service';

import OrderDetailModal from './orders/order-detail-modal';
import OrderRatingModal from './orders/order-rating-modal';

function itemCount(order: Order) {
  return order.items
    .filter((item) => item.eliminacion == null)
    .reduce((sum, item) => sum + item.cantidad, 0);
}

function CardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </View>
  );
}

export default function OrderRatingsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getUnratedFinishedOrders();
      setOrders(data);

      const names = await Promise.all(
        data.map(async (order) => {
          const name = await getRestaurantName(order.restaurantId).catch(
            () => `Local #${order.restaurantId}`,
          );
          return [order.restaurantId, name] as const;
        }),
      );

      setRestaurantNames(Object.fromEntries(names));
    } catch (err) {
      setOrders([]);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los pedidos para calificar.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function getRestaurantLabel(id: number) {
    return restaurantNames[id] ?? `Local #${id}`;
  }

  function handleRatingSaved(orderId: number, _rating: OrderRating) {
    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
    notifyOrderRatingRefresh();
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadOrders('refresh')}
            tintColor={Brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Calificación de pedidos</Text>
        <Text style={styles.subtitle}>
          Calificá los pedidos finalizados que todavía no tienen calificación.
        </Text>

        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>
            {loading
              ? 'Cargando pedidos pendientes de calificación...'
              : orders.length === 0
                ? 'No tenés pedidos pendientes de calificación.'
                : `${orders.length} ${
                    orders.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'
                  } de calificación.`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <HandThumbUpIcon size={40} color={Brand.gray200} />
            <Text style={styles.emptyText}>No tenés pedidos pendientes de calificación.</Text>
          </View>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <View style={styles.list}>
            {orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setSelectedDetailOrder(order)}
                      >
                        <Text style={styles.actionBtnText}>Ver detalles</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setSelectedRatingOrder(order)}
                      >
                        <Text style={styles.actionBtnText}>Calificar</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.restaurantName}>
                      {getRestaurantLabel(order.restaurantId)}
                    </Text>
                  </View>
                  <View style={styles.finalizedBadge}>
                    <Text style={styles.finalizedBadgeText}>Finalizado</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerDate}>{formatOrderDate(order.creacion)}</Text>
                  <View style={styles.footerRight}>
                    <Text style={styles.footerItems}>
                      {itemCount(order)} {itemCount(order) === 1 ? 'item' : 'items'}
                    </Text>
                    <Text style={styles.footerTotal}>{formatOrderPrice(order.total)}</Text>
                  </View>
                </View>

                {order.urlFactura ? (
                  <TouchableOpacity onPress={() => void Linking.openURL(order.urlFactura!)}>
                    <Text style={styles.invoiceLink}>Ver factura</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <OrderDetailModal
        visible={selectedDetailOrder != null}
        order={selectedDetailOrder}
        restaurantName={
          selectedDetailOrder ? getRestaurantLabel(selectedDetailOrder.restaurantId) : ''
        }
        onClose={() => setSelectedDetailOrder(null)}
        onOrderUpdated={() => {}}
      />

      <OrderRatingModal
        key={selectedRatingOrder?.id}
        visible={selectedRatingOrder != null}
        order={selectedRatingOrder}
        onClose={() => setSelectedRatingOrder(null)}
        onSaved={(rating) => {
          if (selectedRatingOrder) {
            handleRatingSaved(selectedRatingOrder.id, rating);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.gray100,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.gray600,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.black,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
    marginBottom: 14,
  },
  statusBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 10,
  },
  skeletonLineWide: {
    height: 14,
    width: '40%',
    borderRadius: 6,
    backgroundColor: Brand.gray200,
  },
  skeletonLine: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    backgroundColor: Brand.gray100,
  },
  skeletonLineShort: {
    height: 12,
    width: '45%',
    borderRadius: 6,
    backgroundColor: Brand.gray100,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Brand.gray400,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTopLeft: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.black,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  restaurantName: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.gray400,
  },
  finalizedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  finalizedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.gray100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  footerDate: {
    fontSize: 11,
    color: Brand.gray400,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerItems: {
    fontSize: 11,
    color: Brand.gray400,
  },
  footerTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.primary,
  },
  invoiceLink: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: Brand.primary,
    textDecorationLine: 'underline',
  },
});
