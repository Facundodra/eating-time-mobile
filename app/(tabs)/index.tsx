import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { LocalList } from '@/lib/cliente/types';
import { getLocales } from '@/services/cliente/cliente-service';
import { CheckCircleIcon, MoonIcon, StarIcon } from 'react-native-heroicons/outline';

type SortKey = 'calificacion_desc' | 'calificacion_asc' | 'nombre_asc' | 'nombre_desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'calificacion_desc', label: 'Mejor calif.' },
  { key: 'calificacion_asc',  label: 'Menor calif.' },
  { key: 'nombre_asc',        label: 'A–Z' },
  { key: 'nombre_desc',       label: 'Z–A' },
];

const sortFns: Record<SortKey, (a: LocalList, b: LocalList) => number> = {
  calificacion_desc: (a, b) => b.califiacion - a.califiacion,
  calificacion_asc:  (a, b) => a.califiacion - b.califiacion,
  nombre_asc:        (a, b) => a.nombre.localeCompare(b.nombre),
  nombre_desc:       (a, b) => b.nombre.localeCompare(a.nombre),
};

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

export default function HomeListado() {
  const { user } = useAuth();
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [locales, setLocales] = useState<LocalList[]>([]);

  const [sort, setSort] = useState<SortKey>('calificacion_desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState(false);

  const loadLocales = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await getLocales(user.roleId);
      setLocales(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => { loadLocales(); }, [loadLocales]);

  let processed = [...locales];
  if (filterOpen)  processed = processed.filter(l => l.estado_servicio);
  if (filterStars) processed = processed.filter(l => l.califiacion >= 4);
  processed.sort(sortFns[sort]);

  return (
    <View style={styles.root}>
      {/* Barra de filtros */}
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

      {/* Contenido */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {listError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{listError}</Text>
          </View>
        ) : listLoading ? (
          <SkeletonGrid />
        ) : processed.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
        ) : (
          <View style={styles.grid}>
            {processed.map(local => (
              <TouchableOpacity key={local.id} style={styles.col} activeOpacity={0.85}>
                <View style={styles.card}>
                  {/* Imagen + badge */}
                  <View style={styles.imgWrapper}>
                    <Image style={styles.img} source={local.url_foto as any} />
                    <View style={[styles.badge, local.estado_servicio ? styles.badgeOpen : styles.badgeClosed]}>
                      {local.estado_servicio
                        ? <CheckCircleIcon size={11} color="#065F46" strokeWidth={2} />
                        : <MoonIcon size={11} color="#6B7280" strokeWidth={2} />}
                      <Text style={[styles.badgeText, local.estado_servicio ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                        {local.estado_servicio ? 'Abierto' : 'Cerrado'}
                      </Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <View style={styles.nombreRow}>
                      <View style={styles.logoCircle}>
                        <Image style={styles.logoImg} source={local.url_foto as any} />
                      </View>
                      <Text style={styles.nombre} numberOfLines={1}>{local.nombre}</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <StarIcon size={13} color="#FB923C" strokeWidth={2} />
                      <Text style={styles.ratingText}>{local.califiacion}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  // Barra filtros
  filterBar: { backgroundColor: '#fff', flexGrow: 0 },
  filterBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterSep: { width: 1, height: 20, backgroundColor: Brand.gray200, marginHorizontal: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: '500', color: Brand.gray600 },
  pillTextActive: { color: '#fff' },

  // Scroll principal
  scrollContent: { padding: 8, paddingBottom: 24 },

  // Grid 2 columnas
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  col: { width: '50%', padding: 5 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: 'hidden' },

  // Imagen
  imgWrapper: { backgroundColor: '#F9FAFB', height: 90, justifyContent: 'center', alignItems: 'center', padding: 15 },
  img: { width: '100%', height: '100%', objectFit: 'contain' },

  // Badge estado
  badge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextOpen: { color: '#065F46' },
  badgeTextClosed: { color: '#6B7280' },

  // Info
  info: { padding: 10, gap: 6 },
  nombreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Brand.gray200, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  nombre: { flex: 1, fontSize: 12, fontWeight: '700', color: Brand.black },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, color: Brand.gray400 },

  // Skeleton
  skeletonCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: 'hidden' },
  skeletonImg: { height: 90, backgroundColor: Brand.gray200 },
  skeletonBody: { padding: 10, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200, width: '80%' },

  // Estados
  errorBanner: { margin: 12, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 40, color: Brand.gray400, fontSize: 14 },
});
