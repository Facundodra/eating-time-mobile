import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderDate, formatOrderPrice } from '@/lib/cliente/order-utils';
import { notifyPendingOrdersRefresh } from '@/lib/cliente/pending-orders-refresh';
import type { Order } from '@/lib/cliente/types';
import {
  CancelOrderError,
  cancelOrder,
  getPendingConfirmationOrders,
  getRestaurantName,
} from '@/services/cliente/cliente-service';

import CancelOrderModal from './orders/cancel-order-modal';
import OrderDetailModal from './orders/order-detail-modal';

function CardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </View>
  );
}

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrders = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getPendingConfirmationOrders();
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
    } catch (loadError) {
      setOrders([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los pedidos en curso.',
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

  function handleOpenCancelModal(order: Order) {
    setCancelError(null);
    setOrderToCancel(order);
  }

  function handleCloseCancelModal() {
    if (isCancelling) return;
    setOrderToCancel(null);
    setCancelError(null);
  }

  async function handleConfirmCancel() {
    if (!orderToCancel) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelOrder(orderToCancel.id);
      setOrderToCancel(null);
      setShowSuccessBanner(true);
      notifyPendingOrdersRefresh();
      await loadOrders('refresh');
    } catch (cancelErr) {
      if (cancelErr instanceof CancelOrderError && cancelErr.notCancelable) {
        setOrderToCancel(null);
        setError(cancelErr.message);
        notifyPendingOrdersRefresh();
        await loadOrders('refresh');
        return;
      }

      setCancelError(
        cancelErr instanceof CancelOrderError
          ? cancelErr.message
          : 'No se pudo cancelar el pedido. Intentalo nuevamente.',
      );
    } finally {
      setIsCancelling(false);
    }
  }

  function handleOrderUpdated(updated: Order) {
    setOrders((current) => current.filter((order) => order.id !== updated.id));
    notifyPendingOrdersRefresh();
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

        <Text style={styles.title}>Pedidos en curso</Text>
        <Text style={styles.subtitle}>
          Pedidos pagados que aún esperan confirmación del local. Podés cancelarlos mientras
          sigan en ese estado.
        </Text>

        {showSuccessBanner ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Tu pedido fue cancelado.</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.skeletonList}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tenés pedidos en curso</Text>
          </View>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <View style={styles.list}>
            {orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.orderId}>Pedido #{order.id}</Text>
                    <Text style={styles.restaurantName}>
                      {getRestaurantLabel(order.restaurantId)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Esperando al local</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Fecha: </Text>
                    {formatOrderDate(order.creacion)}
                  </Text>
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Total: </Text>
                    {formatOrderPrice(order.total)}
                  </Text>
                  {order.direccion ? (
                    <Text style={[styles.metaText, styles.metaFull]}>
                      <Text style={styles.metaLabel}>Dirección: </Text>
                      {order.direccion}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => setSelectedDetailOrder(order)}
                  >
                    <Text style={styles.detailBtnText}>Ver detalle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleOpenCancelModal(order)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar pedido</Text>
                  </TouchableOpacity>
                </View>
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
        onOrderUpdated={handleOrderUpdated}
      />

      <CancelOrderModal
        visible={orderToCancel != null}
        order={orderToCancel}
        restaurantName={orderToCancel ? getRestaurantLabel(orderToCancel.restaurantId) : ''}
        isProcessing={isCancelling}
        onClose={handleCloseCancelModal}
        onConfirm={() => void handleConfirmCancel()}
      />

      {cancelError ? (
        <View style={styles.cancelErrorToast}>
          <Text style={styles.cancelErrorText}>{cancelError}</Text>
        </View>
      ) : null}
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
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
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
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.gray600,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  restaurantName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: Brand.black,
  },
  statusBadge: {
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  metaGrid: {
    marginTop: 14,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Brand.gray600,
    lineHeight: 18,
  },
  metaLabel: {
    fontWeight: '800',
    color: Brand.gray400,
  },
  metaFull: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  detailBtn: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  cancelErrorToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelErrorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
});
