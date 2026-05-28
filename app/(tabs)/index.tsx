import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAuth } from '@/hooks/use-auth';
import type { LocalDto, LocalesParams } from '@/lib/cliente/types';
import { getLocales } from '@/services/cliente/cliente-service';
import { CheckCircleIcon, MoonIcon, StarIcon } from 'react-native-heroicons/outline';

const PAGE_SIZE = 10;

type SortKey = 'calificacion_desc' | 'calificacion_asc' | 'nombre_asc' | 'nombre_desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'calificacion_desc', label: 'Mejor calif.' },
  { key: 'calificacion_asc',  label: 'Menor calif.' },
  { key: 'nombre_asc',        label: 'A–Z' },
  { key: 'nombre_desc',       label: 'Z–A' },
];

function sortToParams(sort: SortKey): Pick<LocalesParams, 'ordenarPor' | 'direccion'> {
  switch (sort) {
    case 'calificacion_desc': return { ordenarPor: 'calificacion', direccion: 'desc' };
    case 'calificacion_asc':  return { ordenarPor: 'calificacion', direccion: 'asc' };
    case 'nombre_asc':        return { ordenarPor: 'nombre', direccion: 'asc' };
    case 'nombre_desc':       return { ordenarPor: 'nombre', direccion: 'desc' };
  }
}

function SkeletonGrid() {
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

function LocalCard({ local }: { local: LocalDto }) {
  return (
    <TouchableOpacity
      style={styles.col}
      activeOpacity={0.85}
      onPress={() => router.push(`/local/${local.id}`)}
    >
      <View style={styles.card}>
        <View style={styles.imgWrapper}>
          {local.urlFoto ? (
            <Image style={styles.img} source={{ uri: local.urlFoto }} resizeMode="contain" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]} />
          )}
          <View style={[styles.badge, local.estadoServicio ? styles.badgeOpen : styles.badgeClosed]}>
            {local.estadoServicio
              ? <CheckCircleIcon size={11} color="#065F46" strokeWidth={2} />
              : <MoonIcon size={11} color="#6B7280" strokeWidth={2} />}
            <Text style={[styles.badgeText, local.estadoServicio ? styles.badgeTextOpen : styles.badgeTextClosed]}>
              {local.estadoServicio ? 'Abierto' : 'Cerrado'}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{local.nombre}</Text>
          <Text style={styles.descripcion} numberOfLines={2}>{local.descripcion}</Text>
          <View style={styles.ratingRow}>
            <StarIcon size={13} color="#FB923C" strokeWidth={2} />
            <Text style={styles.ratingText}>
              {local.calificacion != null ? Number(local.calificacion).toFixed(1) : '—'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeListado() {
  const { user } = useAuth();

  const [locales, setLocales]         = useState<LocalDto[]>([]);
  const [page, setPage]               = useState(0);
  const [isLastPage, setIsLastPage]   = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError]     = useState<string | null>(null);

  const [sort, setSort]               = useState<SortKey>('calificacion_desc');
  const [filterOpen, setFilterOpen]   = useState(false);
  const [filterStars, setFilterStars] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const buildParams = useCallback((pageNum: number): LocalesParams => ({
    ...sortToParams(sort),
    ...(filterOpen  ? { servicio: 'ACTIVO' as const } : {}),
    ...(filterStars ? { calificacionMin: 4 } : {}),
    page: pageNum,
    size: PAGE_SIZE,
  }), [sort, filterOpen, filterStars]);

  const fetchFirst = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setListLoading(true);
    setListError(null);
    setLocales([]);
    setPage(0);
    setIsLastPage(false);

    try {
      const result = await getLocales(buildParams(0));
      if (ctrl.signal.aborted) return;
      setLocales(result.content);
      setIsLastPage(result.last);
      setPage(0);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setListError(e instanceof Error ? e.message : 'Error al cargar los locales');
    } finally {
      if (!ctrl.signal.aborted) setListLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchFirst(); }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMore || listLoading || isLastPage) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await getLocales(buildParams(nextPage));
      setLocales(prev => [...prev, ...result.content]);
      setIsLastPage(result.last);
      setPage(nextPage);
    } catch {
      // Error silencioso en paginación
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, listLoading, isLastPage, page, buildParams]);

  const pairs = locales.reduce<LocalDto[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item]);
    else acc[acc.length - 1].push(item);
    return acc;
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.pill, sort === opt.key && styles.pillActive]}
            onPress={() => setSort(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, sort === opt.key && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.filterSep} />

        <TouchableOpacity
          style={[styles.pill, filterOpen && styles.pillActive]}
          onPress={() => setFilterOpen(v => !v)}
          activeOpacity={0.7}
        >
          <CheckCircleIcon size={14} color={filterOpen ? '#fff' : Brand.gray600} strokeWidth={2} />
          <Text style={[styles.pillText, filterOpen && styles.pillTextActive]}>Abiertos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, filterStars && styles.pillActive]}
          onPress={() => setFilterStars(v => !v)}
          activeOpacity={0.7}
        >
          <StarIcon size={14} color={filterStars ? '#fff' : Brand.gray600} strokeWidth={2} />
          <Text style={[styles.pillText, filterStars && styles.pillTextActive]}>4+ estrellas</Text>
        </TouchableOpacity>
      </ScrollView>

      {listLoading ? (
        <SkeletonGrid />
      ) : listError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity onPress={fetchFirst} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pairs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.scrollContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron resultados</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={Brand.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item: pair }) => (
            <View style={styles.grid}>
              {pair.map(local => <LocalCard key={local.id} local={local} />)}
              {pair.length === 1 && <View style={styles.col} />}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  filterBar: { backgroundColor: '#fff', flexGrow: 0 },
  filterBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterSep: { width: 1, height: 20, backgroundColor: Brand.gray200, marginHorizontal: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: '500', color: Brand.gray600 },
  pillTextActive: { color: '#fff' },

  scrollContent: { padding: 8, paddingBottom: 24 },
  grid: { flexDirection: 'row' },
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
  retryBtn: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Brand.gray400, fontSize: 14 },
});