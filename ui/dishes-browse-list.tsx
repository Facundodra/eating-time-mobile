import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TagIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import type { ClientDish, Discount } from '@/lib/cliente/types';
import {
  getDishDiscount,
  getDishes,
  getDiscountedDishIds,
  getOrderAgainDishes,
  type DishFilter,
} from '@/services/cliente/cliente-service';

const PAGE_SIZE = 20;

type Props = {
  initialNombre?: string;
  initialCategorias?: string[];
  initialConDescuento?: boolean;
  initialOrden?: DishFilter['orden'];
  pedirNuevamente?: boolean;
};

function DishRow({
  item,
  discount,
}: {
  item: ClientDish;
  discount?: Discount | null;
}) {
  const discountedPrice = discount
    ? Math.round(item.price * (1 - discount.porcentaje / 100) * 100) / 100
    : null;

  return (
    <TouchableOpacity
      style={styles.rowCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/(tabs)/plato/[id]', params: { id: item.id } })}
    >
      <View style={styles.rowImgWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.rowImg} resizeMode="cover" />
        ) : (
          <Text style={styles.rowImgPlaceholder}>{item.name.charAt(0).toUpperCase()}</Text>
        )}
        {discount ? (
          <View style={styles.discountBadge}>
            <TagIcon size={11} color="#fff" />
            <Text style={styles.discountBadgeText}>-{discount.porcentaje}%</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
        {item.localName ? (
          <Text style={styles.localName} numberOfLines={1}>{item.localName}</Text>
        ) : null}
        {discountedPrice != null ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>${discountedPrice}</Text>
            <Text style={styles.originalPrice}>${item.price}</Text>
          </View>
        ) : (
          <Text style={styles.price}>${item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DishesBrowseList({
  initialNombre = '',
  initialCategorias,
  initialConDescuento = false,
  initialOrden,
  pedirNuevamente = false,
}: Props) {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [discountedIds, setDiscountedIds] = useState<Set<number> | null>(null);
  const [discounts, setDiscounts] = useState<Map<number, Discount | null>>(new Map());
  const requestedDiscountIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    setDiscountedIds(null);
    setDiscounts(new Map());
    requestedDiscountIds.current = new Set();
    getDiscountedDishIds()
      .then(setDiscountedIds)
      .catch(() => setDiscountedIds(new Set()));
  }, []);

  useEffect(() => {
    if (!discountedIds) return;
    const idsToFetch = dishes
      .map((d) => Number(d.id))
      .filter((id) => discountedIds.has(id) && !requestedDiscountIds.current.has(id));
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id) => requestedDiscountIds.current.add(id));
    Promise.allSettled(idsToFetch.map(getDishDiscount)).then((results) => {
      setDiscounts((prev) => {
        const next = new Map(prev);
        results.forEach((result, i) => {
          next.set(idsToFetch[i], result.status === 'fulfilled' ? result.value : null);
        });
        return next;
      });
    });
  }, [dishes, discountedIds]);

  const loadPage = useCallback((pageToLoad: number, replace: boolean) => {
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const run = pedirNuevamente
      ? getOrderAgainDishes(50).then((dishes) => ({
          dishes,
          totalPages: 1,
          page: 0,
        }))
      : getDishes({
          nombre: initialNombre.trim() || undefined,
          categorias: initialCategorias?.length ? initialCategorias : undefined,
          conDescuento: initialConDescuento || undefined,
          orden: initialOrden,
          sentido: initialOrden === 'popularidad' ? 'desc' : undefined,
          pagina: pageToLoad,
          tamano: PAGE_SIZE,
        });

    run
      .then((data) => {
        setDishes((prev) => (replace ? data.dishes : [...prev, ...data.dishes]));
        setHasMore(!pedirNuevamente && data.page + 1 < data.totalPages);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [initialCategorias, initialConDescuento, initialNombre, initialOrden, pedirNuevamente]);

  const filterKey = [
    initialNombre,
    initialCategorias?.join(','),
    initialConDescuento,
    initialOrden,
    pedirNuevamente,
  ].join('\0');

  useEffect(() => {
    setPage(0);
    loadPage(0, true);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={dishes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <DishRow item={item} discount={discounts.get(Number(item.id))} />
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No se encontraron platos.</Text>
      }
      onEndReached={() => {
        if (hasMore && !loadingMore) {
          const next = page + 1;
          setPage(next);
          loadPage(next, false);
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={Brand.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.gray100 },
  listContent: { padding: 12, paddingBottom: 24 },
  rowCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rowImgWrapper: {
    width: 96,
    height: 96,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rowImg: { width: '100%', height: '100%' },
  rowImgPlaceholder: { fontSize: 32, fontWeight: '900', color: Brand.primary },
  rowInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  rowName: { fontSize: 15, fontWeight: '700', color: Brand.black },
  localName: { fontSize: 12, color: Brand.gray400 },
  price: { fontSize: 15, fontWeight: '700', color: Brand.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  originalPrice: { fontSize: 12, color: Brand.gray400, textDecorationLine: 'line-through' },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Brand.primary,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  errorBanner: { margin: 16, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 16 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: Brand.gray400, fontSize: 14 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
