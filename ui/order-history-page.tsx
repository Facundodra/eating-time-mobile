import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon, ReceiptPercentIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { notifyOrderRatingRefresh } from '@/lib/cliente/order-rating-refresh';
import {
  ORDER_PAGE_SIZE,
  sortMap,
  toEndOfDay,
  toStartOfDay,
  type SortKey,
} from '@/lib/cliente/order-utils';
import type { Order, OrderRating } from '@/lib/cliente/types';
import {
  getOrderHistory,
  getOrderHistoryRestaurants,
  getOrderLocalRating,
  type OrderHistoryFilter,
  type OrderHistoryRestaurant,
} from '@/services/cliente/cliente-service';

import OrderDetailModal from './orders/order-detail-modal';
import OrderHistoryCard from './orders/order-history-card';
import OrderHistoryFilters from './orders/order-history-filters';
import OrderRatingModal from './orders/order-rating-modal';

function CardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );
}

function mergeOrderRating(order: Order, rating: OrderRating): Order {
  return {
    ...order,
    calificacionLocal: rating,
    hasLocalRating: true,
  };
}

function isOrderRated(order: Order) {
  return order.hasLocalRating || Boolean(order.calificacionLocal);
}

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const redirectStarted = useRef(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SortKey>('fecha-desc');
  const [localId, setLocalId] = useState('');
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<OrderHistoryFilter>({});

  const [restaurants, setRestaurants] = useState<OrderHistoryRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);
  const [loadingRatingOrderId, setLoadingRatingOrderId] = useState<number | null>(null);
  const [ratingLoadError, setRatingLoadError] = useState<string | null>(null);

  const hasNoOrdersAtAll = !restaurantsLoading && restaurants.length === 0;
  const hasMore = page + 1 < totalPages;
  const controlsDisabled = restaurantsLoading;

  useEffect(() => {
    if (authLoading || user || redirectStarted.current) return;

    redirectStarted.current = true;
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 1800);

    return () => clearTimeout(timer);
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;

    setRestaurantsLoading(true);

    getOrderHistoryRestaurants()
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setRestaurantsLoading(false));
  }, [user]);

  const loadPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (!user) return;

      if (hasNoOrdersAtAll) {
        setOrders([]);
        setTotalPages(0);
        setPage(0);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode !== 'more') setError(null);

      try {
        const { orders: data, totalPages: pages } = await getOrderHistory({
          ...appliedFilter,
          ...sortMap[sort],
          page: targetPage,
          size: ORDER_PAGE_SIZE,
        });

        setTotalPages(pages);
        setPage(targetPage);
        setOrders((current) => (mode === 'more' ? [...current, ...data] : data));
      } catch (err) {
        if (mode !== 'more') {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.');
          setOrders([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [appliedFilter, hasNoOrdersAtAll, sort, user],
  );

  useEffect(() => {
    if (!user || restaurantsLoading) return;
    void loadPage(0, 'initial');
  }, [user, restaurantsLoading, hasNoOrdersAtAll, appliedFilter, sort, loadPage]);

  function applyFilters() {
    const next: OrderHistoryFilter = {};
    if (localId !== '') next.localId = Number(localId);
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);
    setAppliedFilter(next);
  }

  function handleSortChange(nextSort: SortKey) {
    setSort(nextSort);
  }

  function getRestaurantName(id: number) {
    return restaurants.find((r) => r.id === id)?.name ?? `Local #${id}`;
  }

  function handleRatingSaved(orderId: number, rating: OrderRating) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? mergeOrderRating(order, rating) : order,
      ),
    );
    notifyOrderRatingRefresh();
  }

  async function handleOpenRating(order: Order) {
    setRatingLoadError(null);
    setLoadingRatingOrderId(order.id);

    try {
      let orderToShow = order;

      if (!order.calificacionLocal?.calificacion) {
        const rating = await getOrderLocalRating(order.id);
        if (rating) {
          orderToShow = mergeOrderRating(order, rating);
          setOrders((currentOrders) =>
            currentOrders.map((currentOrder) =>
              currentOrder.id === order.id ? orderToShow : currentOrder,
            ),
          );
        }
      }

      setSelectedRatingOrder(orderToShow);
    } catch (err) {
      setRatingLoadError(
        err instanceof Error ? err.message : 'No se pudo cargar la calificación guardada.',
      );
    } finally {
      setLoadingRatingOrderId(null);
    }
  }

  function handleOrderUpdated(updated: Order) {
    setOrders((current) =>
      current.map((order) => (order.id === updated.id ? updated : order)),
    );
  }

  function handleLoadMore() {
    if (loading || loadingMore || !hasMore || hasNoOrdersAtAll) return;
    void loadPage(page + 1, 'more');
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.authTitle}>Iniciá sesión</Text>
        <Text style={styles.authText}>
          Tenés que iniciar sesión para ver tu historial de pedidos.
        </Text>
        <ActivityIndicator style={{ marginTop: 16 }} color={Brand.primary} />
      </View>
    );
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeftIcon size={20} color={Brand.gray600} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Historial de pedidos</Text>
      <Text style={styles.subtitle}>Consultá tus pedidos anteriores.</Text>

      <OrderHistoryFilters
        sort={sort}
        localId={localId}
        desde={desde}
        hasta={hasta}
        restaurants={restaurants}
        restaurantsLoading={restaurantsLoading}
        controlsDisabled={controlsDisabled}
        hasNoOrdersAtAll={hasNoOrdersAtAll}
        onSortChange={handleSortChange}
        onLocalIdChange={setLocalId}
        onDesdeChange={setDesde}
        onHastaChange={setHasta}
        onApplyFilters={applyFilters}
      />

      {ratingLoadError ? (
        <Text style={styles.errorBanner}>{ratingLoadError}</Text>
      ) : null}
    </View>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.root}>
        {listHeader}
        <View style={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPage(0, 'refresh')}
            tintColor={Brand.primary}
          />
        }
        renderItem={({ item }) => (
          <OrderHistoryCard
            order={item}
            restaurantName={getRestaurantName(item.restaurantId)}
            loadingRating={loadingRatingOrderId === item.id}
            isRated={isOrderRated(item)}
            onOpenDetail={() => setSelectedDetailOrder(item)}
            onOpenRating={() => void handleOpenRating(item)}
          />
        )}
        ListEmptyComponent={
          error ? (
            <Text style={styles.errorBanner}>{error}</Text>
          ) : (
            <View style={styles.emptyWrap}>
              <ReceiptPercentIcon size={40} color={Brand.gray200} />
              <Text style={styles.emptyText}>
                {hasNoOrdersAtAll
                  ? 'No se encontraron pedidos realizados.'
                  : 'No se encontraron pedidos para los filtros aplicados.'}
              </Text>
            </View>
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={Brand.primary} />
          ) : null
        }
      />

      <OrderDetailModal
        visible={selectedDetailOrder != null}
        order={selectedDetailOrder}
        restaurantName={
          selectedDetailOrder
            ? getRestaurantName(selectedDetailOrder.restaurantId)
            : ''
        }
        onClose={() => setSelectedDetailOrder(null)}
        onOrderUpdated={handleOrderUpdated}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gray100,
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.black,
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    color: Brand.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  headerBlock: {
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -4,
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
    fontSize: 13,
    color: Brand.gray400,
    marginTop: -6,
  },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    borderRadius: 10,
    padding: 12,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    borderRadius: 10,
    padding: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Brand.gray400,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  skeletonList: {
    paddingHorizontal: 14,
    gap: 10,
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
    width: '55%',
    borderRadius: 6,
    backgroundColor: Brand.gray200,
  },
  skeletonLine: {
    height: 12,
    width: '80%',
    borderRadius: 6,
    backgroundColor: Brand.gray200,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
