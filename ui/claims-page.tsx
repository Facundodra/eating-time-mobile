import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChatBubbleLeftRightIcon, ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import {
  CLAIM_PAGE_SIZE,
  claimSortMap,
  claimStatusColors,
  claimStatusShortLabels,
  toEndOfDay,
  toStartOfDay,
  type ClaimSortKey,
} from '@/lib/cliente/claim-utils';
import { formatOrderDate, formatOrderPrice } from '@/lib/cliente/order-utils';
import type { OrderClaim } from '@/lib/cliente/types';
import {
  getClientClaimRestaurants,
  getClientClaims,
  type ClientClaimFilter,
  type ClientClaimRestaurant,
} from '@/services/cliente/claim-service';

import ClaimFilters from './claims/claim-filters';
import ViewClaimModal from './orders/view-claim-modal';

function truncateText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
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

export default function ClaimsPage() {
  const [claims, setClaims] = useState<OrderClaim[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<ClaimSortKey>('estado-desc');
  const [localId, setLocalId] = useState('');
  const [status, setStatus] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<ClientClaimFilter>({});

  const [restaurants, setRestaurants] = useState<ClientClaimRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState(false);

  const [selectedClaim, setSelectedClaim] = useState<OrderClaim | null>(null);

  const hasMore = page + 1 < totalPages;
  const controlsDisabled = restaurantsLoading;

  useEffect(() => {
    let ignore = false;

    setRestaurantsLoading(true);
    setRestaurantsError(false);

    getClientClaimRestaurants()
      .then((data) => {
        if (!ignore) setRestaurants(data);
      })
      .catch(() => {
        if (!ignore) {
          setRestaurants([]);
          setRestaurantsError(true);
        }
      })
      .finally(() => {
        if (!ignore) setRestaurantsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode !== 'more') setError(null);

      try {
        const { claims: data, totalPages: pages } = await getClientClaims({
          ...appliedFilter,
          ...claimSortMap[sort],
          page: targetPage,
          size: CLAIM_PAGE_SIZE,
        });

        setTotalPages(pages);
        setPage(targetPage);
        setClaims((current) => (mode === 'more' ? [...current, ...data] : data));
      } catch (err) {
        if (mode !== 'more') {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los reclamos.');
          setClaims([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [appliedFilter, sort],
  );

  useEffect(() => {
    if (restaurantsLoading) return;
    void loadPage(0, 'initial');
  }, [restaurantsLoading, appliedFilter, sort, loadPage]);

  function applyFilters() {
    const next: ClientClaimFilter = {};
    if (localId !== '') next.localId = Number(localId);
    if (status !== '') next.estado = status as ClientClaimFilter['estado'];
    if (pedidoId.trim() !== '') next.pedidoId = Number(pedidoId);
    if (desde) next.desde = toStartOfDay(desde);
    if (hasta) next.hasta = toEndOfDay(hasta);
    setAppliedFilter(next);
  }

  function handleLoadMore() {
    if (loading || loadingMore || !hasMore) return;
    void loadPage(page + 1, 'more');
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeftIcon size={20} color={Brand.gray600} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Seguimiento de reclamos</Text>
      <Text style={styles.subtitle}>
        Consultá el estado de tus reclamos y la respuesta de cada local.
      </Text>

      <ClaimFilters
        sort={sort}
        localId={localId}
        status={status}
        pedidoId={pedidoId}
        desde={desde}
        hasta={hasta}
        restaurants={restaurants}
        restaurantsLoading={restaurantsLoading}
        controlsDisabled={controlsDisabled}
        onSortChange={setSort}
        onLocalIdChange={setLocalId}
        onStatusChange={setStatus}
        onPedidoIdChange={setPedidoId}
        onDesdeChange={setDesde}
        onHastaChange={setHasta}
        onApplyFilters={applyFilters}
      />

      {restaurantsError ? (
        <Text style={styles.warningBanner}>
          No se pudieron cargar los locales desde el servidor.
        </Text>
      ) : null}
    </View>
  );

  if (loading && claims.length === 0) {
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
        data={claims}
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
        renderItem={({ item }) => {
          const statusStyle = claimStatusColors[item.estado];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.cardDate}>{formatOrderDate(item.creacion)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                      {claimStatusShortLabels[item.estado]}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedClaim(item)}>
                  <Text style={styles.viewClaimBtn}>Ver reclamo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.orderMeta}>
                Pedido #{item.pedidoId}
                {item.pedidoTotal != null ? ` · ${formatOrderPrice(item.pedidoTotal)}` : ''}
              </Text>

              <Text style={styles.localName}>
                {item.localNombre ?? `Local #${item.localId ?? '—'}`}
              </Text>

              <Text style={styles.claimPreviewLabel}>Tu reclamo</Text>
              <Text style={styles.claimPreview} numberOfLines={2}>
                {truncateText(item.descripcion)}
              </Text>

              <Text style={styles.claimId}>Reclamo #{item.id}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          error ? (
            <Text style={styles.errorBanner}>{error}</Text>
          ) : (
            <View style={styles.emptyWrap}>
              <ChatBubbleLeftRightIcon size={40} color={Brand.gray200} />
              <Text style={styles.emptyText}>
                No se encontraron reclamos para los filtros aplicados.
              </Text>
              <TouchableOpacity onPress={() => router.push('/cliente/historial-pedidos')}>
                <Text style={styles.emptyLink}>Ir al historial de pedidos</Text>
              </TouchableOpacity>
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

      <ViewClaimModal
        visible={selectedClaim != null}
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  listContent: { paddingHorizontal: 14, paddingBottom: 24 },
  headerBlock: { paddingTop: 14, paddingBottom: 8, gap: 12 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -4,
  },
  backText: { fontSize: 15, fontWeight: '600', color: Brand.gray600 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.black },
  subtitle: { fontSize: 13, color: Brand.gray400, lineHeight: 18, marginTop: -6 },
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
  skeletonList: { gap: 10 },
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
  skeletonLineShort: {
    height: 12,
    width: '45%',
    borderRadius: 6,
    backgroundColor: Brand.gray200,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTopLeft: { flex: 1, gap: 6 },
  cardDate: { fontSize: 14, fontWeight: '800', color: Brand.black },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  viewClaimBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  orderMeta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: Brand.primary,
  },
  localName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: Brand.black,
  },
  claimPreviewLabel: {
    marginTop: 12,
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  claimPreview: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
  },
  claimId: {
    marginTop: 10,
    fontSize: 11,
    color: Brand.gray400,
    textAlign: 'right',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: {
    fontSize: 14,
    color: Brand.gray400,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
    marginTop: 4,
  },
  footerLoader: { paddingVertical: 16 },
});
