import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  StarIcon,
} from 'react-native-heroicons/outline';


function RestaurantSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.col}>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonImg} />
            <View style={styles.skeletonBody}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '50%' }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const PAGE_SIZE = 12;

type SortKey = "calificacion_desc" | "calificacion_asc" | "nombre_asc" | "nombre_desc";

const sortMap: Record<SortKey, { ordenarPor: 'calificacion' | 'nombre'; direccion: 'asc' | 'desc' }> = {
  calificacion_desc: { ordenarPor: 'calificacion', direccion: 'desc' },
  calificacion_asc:  { ordenarPor: 'calificacion', direccion: 'asc'  },
  nombre_asc:        { ordenarPor: 'nombre',        direccion: 'asc'  },
  nombre_desc:       { ordenarPor: 'nombre',        direccion: 'desc' },
};

const sortLabels: Record<SortKey, string> = {
  calificacion_desc: 'Mejor calificación',
  calificacion_asc: 'Menor calificación',
  nombre_asc: 'A-Z',
  nombre_desc: 'Z-A',
};

export default function RestaurantList() {
  const [restaurant, setRestaurants] = useState<RestaurantList[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("calificacion_desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    getRestaurants({
      ...sortMap[sort],
      ...(filterOpen  && { servicio: 'ACTIVO' as const }),
      ...(filterStars && { calificacionMin: 4 }),
      page: page - 1,
      size: PAGE_SIZE,
    })
      .then(({ restaurants, totalPages }) => {
        if (cancelled) return;
        setRestaurants(restaurants);
        setTotalPages(totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sort, filterOpen, filterStars, page]);

  function applySort(value: SortKey) {
    setSort(value);
    setPage(1);
  }

  function toggleOpen() {
    setFilterOpen((v) => !v);
    setPage(1);
  }

  function toggleStars() {
    setFilterStars((v) => !v);
    setPage(1);
  }

  if (error) {
    return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return <RestaurantSkeleton />;
  }

  if (restaurant.length === 0) {
    return (
      <Text style={styles.emptyText}>No hay locales que coincidan con su búsqueda.</Text>
    );
  }

  return (
    <View style={styles.root}>
      {/* Barra de filtros */}
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

      {/* Lista */}
      <FlatList
        data={restaurant}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <View style={styles.col}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/local/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.imgWrapper}>
                {item.url_photo ? (
                  <Image
                    source={{ uri: item.url_photo }}
                    style={styles.img}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]} />
                )}

                <View style={[styles.badge, item.state ? styles.badgeOpen : styles.badgeClosed]}>
                  {item.state ? (
                    <CheckCircleIcon size={12} color="#065F46" />
                  ) : (
                    <MoonIcon size={12} color="#6B7280" />
                  )}
                  <Text style={[styles.badgeText, item.state ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                    {item.state ? 'Abierto' : 'Cerrado'}
                  </Text>
                </View>
              </View>

              <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={1}>{item.name}</Text>
                <View style={styles.ratingRow}>
                  <StarIcon size={13} color="#FB923C" />
                  <Text style={styles.ratingText}>{item.stars} (384)</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pagination}
          contentContainerStyle={styles.paginationContent}
        >
          <TouchableOpacity
            onPress={() => setPage((p) => p - 1)}
            disabled={page === 1}
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
          >
            <ChevronLeftIcon size={16} color={page === 1 ? Brand.gray200 : Brand.gray600} />
          </TouchableOpacity>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setPage(n)}
              style={[styles.pageBtn, n === page && styles.pageBtnActive]}
            >
              <Text style={[styles.pageBtnText, n === page && styles.pageBtnTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
          >
            <ChevronRightIcon size={16} color={page === totalPages ? Brand.gray200 : Brand.gray600} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  filterBar: { backgroundColor: '#fff', flexGrow: 0 },
  filterBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Brand.gray800 },
  filterSep: { width: 1, height: 20, backgroundColor: Brand.gray200, marginHorizontal: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: '500', color: Brand.gray600 },
  pillTextActive: { color: '#fff' },

  scrollContent: { padding: 8, paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  col: { width: '50%', padding: 5 },

  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: 'hidden' },

  imgWrapper: { backgroundColor: '#F9FAFB', height: 100, justifyContent: 'center', alignItems: 'center', padding: 12 },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { backgroundColor: Brand.gray200, borderRadius: 8 },

  badge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextOpen: { color: '#065F46' },
  badgeTextClosed: { color: '#6B7280' },

  info: { padding: 10, gap: 4 },
  nombre: { fontSize: 13, fontWeight: '700', color: Brand.black },
  descripcion: { fontSize: 11, color: Brand.gray400, lineHeight: 15 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: Brand.gray400 },

  skeletonCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: 'hidden' },
  skeletonImg: { height: 100, backgroundColor: Brand.gray200 },
  skeletonBody: { padding: 10, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200, width: '80%' },

  errorBanner: { margin: 16, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 16, alignItems: 'center', gap: 10 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500', textAlign: 'center' },

  emptyText: { textAlign: 'center', marginTop: 40, color: Brand.gray400, fontSize: 14 },

  pagination: { flexGrow: 0, marginTop: 8, marginBottom: 16 },
  paginationContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: Brand.gray200, justifyContent: 'center', alignItems: 'center' },
  pageBtnActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '500', color: Brand.gray600 },
  pageBtnTextActive: { color: '#fff' },
});
