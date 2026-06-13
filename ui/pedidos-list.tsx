import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ClipboardDocumentListIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import type { PedidoDto, PedidoEstado } from '@/lib/cliente/types';
import { getHistorial } from '@/services/cliente/pedido-service';

const PAGE_SIZE = 10;

const ESTADO_LABEL: Record<PedidoEstado, string> = {
  EN_CARRITO: 'En carrito',
  ETAPA_DE_PAGO: 'En pago',
  PENDIENTE_CONFIRMACION_LOCAL: 'Pendiente confirmación',
  CONFIRMADO: 'Confirmado',
  EN_PREPARACION: 'En preparación',
  EN_CAMINO: 'En camino',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLOR: Record<PedidoEstado, string> = {
  EN_CARRITO: '#6B7280',
  ETAPA_DE_PAGO: '#6B7280',
  PENDIENTE_CONFIRMACION_LOCAL: '#D97706',
  CONFIRMADO: '#2563EB',
  EN_PREPARACION: '#2563EB',
  EN_CAMINO: '#7C3AED',
  FINALIZADO: '#16A34A',
  CANCELADO: '#DC2626',
};

function PedidoCardSkeleton() {
  return (
    <View style={[styles.card, { gap: 10 }]}>
      <View style={[styles.skeletonLine, { width: '55%', height: 16 }]} />
      <View style={[styles.skeletonLine, { width: '30%', height: 20, borderRadius: 10 }]} />
      <View style={[styles.skeletonLine, { width: '40%' }]} />
    </View>
  );
}

export default function PedidosList() {
  const [pedidos, setPedidos] = useState<PedidoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  const load = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true);
      setError(null);
      pageRef.current = 0;
      hasMoreRef.current = true;
    }
    try {
      const result = await getHistorial({ page: pageRef.current, size: PAGE_SIZE });
      setPedidos(reset ? result.content : (prev) => [...prev, ...result.content]);
      hasMoreRef.current = pageRef.current < result.totalPages - 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  async function handleLoadMore() {
    if (!hasMoreRef.current || loadingMore || loading) return;
    pageRef.current += 1;
    setLoadingMore(true);
    await load(false);
  }

  function handlePressPedido(pedido: PedidoDto) {
    router.push({
      pathname: '/(tabs)/pedido/[id]' as any,
      params: { id: String(pedido.id), pedido: JSON.stringify(pedido) },
    });
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Mis pedidos</Text>
        <View style={{ gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <PedidoCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => load(true)} style={styles.retryBtn}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<Text style={styles.title}>Mis pedidos</Text>}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ClipboardDocumentListIcon size={56} color={Brand.gray400} />
          <Text style={styles.emptyText}>Todavía no tenés pedidos.</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={{ marginTop: 16 }} color={Brand.primary} /> : null
      }
      renderItem={({ item }) => {
        const color = ESTADO_COLOR[item.estado];
        const fecha = new Date(item.creacion).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return (
          <TouchableOpacity style={styles.card} onPress={() => handlePressPedido(item)} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <Text style={styles.localNombre} numberOfLines={1}>{item.localNombre}</Text>
              <Text style={styles.fecha}>{fecha}</Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
              <Text style={[styles.estadoText, { color }]}>{ESTADO_LABEL[item.estado]}</Text>
            </View>
            <Text style={styles.total}>${item.total.toFixed(2)}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '800', color: Brand.black, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 8,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  localNombre: { fontSize: 16, fontWeight: '700', color: Brand.black, flex: 1 },
  fecha: { fontSize: 12, color: Brand.gray400, marginLeft: 8 },
  estadoBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  estadoText: { fontSize: 12, fontWeight: '600' },
  total: { fontSize: 15, fontWeight: '700', color: Brand.primary },
  centered: { alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Brand.gray400 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Brand.primary, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },
});
