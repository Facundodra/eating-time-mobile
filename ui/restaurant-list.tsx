import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Brand } from '@/constants/theme';
import type { RestaurantList } from '@/lib/cliente/types';
import { getRestaurants } from '@/services/cliente/cliente-service';
import { applyRestaurantAvailability } from '@/services/cliente/restaurant-availability-service';
import {
  CheckCircleIcon,
  MoonIcon,
  StarIcon,
} from 'react-native-heroicons/outline';

const PAGE_SIZE = 12;

type SortKey = 'calificacion_desc' | 'calificacion_asc' | 'nombre_asc' | 'nombre_desc';

const sortMap: Record<SortKey, { ordenarPor: 'calificacion' | 'nombre'; direccion: 'asc' | 'desc' }> = {
  calificacion_desc: { ordenarPor: 'calificacion', direccion: 'desc' },
  calificacion_asc: { ordenarPor: 'calificacion', direccion: 'asc' },
  nombre_asc: { ordenarPor: 'nombre', direccion: 'asc' },
  nombre_desc: { ordenarPor: 'nombre', direccion: 'desc' },
};

const sortLabels: Record<SortKey, string> = {
  calificacion_desc: 'Mejor calificación',
  calificacion_asc: 'Menor calificación',
  nombre_asc: 'A-Z',
  nombre_desc: 'Z-A',
};

type Props = {
  initialNombre?: string;
};

function RestaurantRow({ item }: { item: RestaurantList }) {
  return (
    <TouchableOpacity
      style={styles.rowCard}
      onPress={() => router.push(`/(tabs)/local/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.rowImgWrapper}>
        {item.url_photo ? (
          <Image source={{ uri: item.url_photo }} style={styles.rowImg} resizeMode="cover" />
        ) : (
          <Text style={styles.rowImgPlaceholder}>🍽</Text>
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <StarIcon size={13} color="#FB923C" />
          <Text style={styles.ratingText}>{item.stars}</Text>
        </View>
        <View style={[styles.badge, item.state ? styles.badgeOpen : styles.badgeClosed]}>
          {item.state ? (
            <CheckCircleIcon size={11} color="#065F46" />
          ) : (
            <MoonIcon size={11} color="#6B7280" />
          )}
          <Text style={[styles.badgeText, item.state ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {item.state ? 'Abierto' : 'Cerrado'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RestaurantList({ initialNombre = '' }: Props) {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<SortKey>('calificacion_desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState(false);
  const [searchNombre, setSearchNombre] = useState(initialNombre);

  useEffect(() => {
    setSearchNombre(initialNombre);
  }, [initialNombre]);

  const loadPage = useCallback((pageToLoad: number, replace: boolean) => {
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    getRestaurants({
      ...sortMap[sort],
      ...(filterOpen && { servicio: 'ACTIVO' as const }),
      ...(filterStars && { calificacionMin: 4 }),
      ...(searchNombre.trim() && { nombre: searchNombre.trim() }),
      page: pageToLoad,
      size: PAGE_SIZE,
    })
      .then(async ({ restaurants: batch, totalPages }) => {
        const batchWithAvailability = await applyRestaurantAvailability(batch).catch(() => batch);
        setRestaurants((prev) => (replace ? batchWithAvailability : [...prev, ...batchWithAvailability]));
        setHasMore(pageToLoad + 1 < totalPages);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [filterOpen, filterStars, searchNombre, sort]);

  useEffect(() => {
    setPage(0);
    loadPage(0, true);
  }, [loadPage]);

  function applySort(value: SortKey) {
    setSort(value);
    setPage(0);
  }

  function toggleOpen() {
    setFilterOpen((v) => !v);
    setPage(0);
  }

  function toggleStars() {
    setFilterStars((v) => !v);
    setPage(0);
  }

  const filterBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterBar}
      contentContainerStyle={styles.filterBarContent}
    >
      <Text style={styles.filterLabel}>Ordenar:</Text>
      {(Object.keys(sortMap) as SortKey[]).map((key) => (
        <TouchableOpacity
          key={key}
          onPress={() => applySort(key)}
          style={[styles.pill, sort === key && styles.pillActive]}
        >
          <Text style={[styles.pillText, sort === key && styles.pillTextActive]}>
            {sortLabels[key]}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.filterSep} />

      <Text style={styles.filterLabel}>Filtrar:</Text>

      <TouchableOpacity
        onPress={toggleOpen}
        style={[styles.pill, filterOpen && styles.pillActive]}
      >
        <CheckCircleIcon size={14} color={filterOpen ? '#fff' : Brand.gray600} />
        <Text style={[styles.pillText, filterOpen && styles.pillTextActive]}>Abiertos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleStars}
        style={[styles.pill, filterStars && styles.pillActive]}
      >
        <StarIcon size={14} color={filterStars ? '#fff' : Brand.gray600} />
        <Text style={[styles.pillText, filterStars && styles.pillTextActive]}>4+ estrellas</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.root}>
        {filterBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        {filterBar}
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={filterBar}
        renderItem={({ item }) => <RestaurantRow item={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay locales que coincidan con su búsqueda.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterBar: { backgroundColor: '#fff', flexGrow: 0 },
  filterBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Brand.gray800 },
  filterSep: { width: 1, height: 20, backgroundColor: Brand.gray200, marginHorizontal: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: '500', color: Brand.gray600 },
  pillTextActive: { color: '#fff' },

  listContent: { padding: 12, paddingBottom: 24, gap: 10 },
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
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowImg: { width: '100%', height: '100%' },
  rowImgPlaceholder: { fontSize: 28 },
  rowInfo: { flex: 1, padding: 12, gap: 6, justifyContent: 'center' },
  rowName: { fontSize: 15, fontWeight: '700', color: Brand.black },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: Brand.gray600 },

  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextOpen: { color: '#065F46' },
  badgeTextClosed: { color: '#6B7280' },

  errorBanner: { margin: 16, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 16, alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: Brand.gray400, fontSize: 14 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
