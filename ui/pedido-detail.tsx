import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon, StarIcon } from 'react-native-heroicons/outline';
import { StarIcon as StarIconSolid } from 'react-native-heroicons/solid';

import { Brand } from '@/constants/theme';
import type { PedidoDto, PedidoEstado } from '@/lib/cliente/types';
import { cancelarPedido, crearCalificacion } from '@/services/cliente/pedido-service';

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

type Props = { pedido: PedidoDto };

function CancelarSection({ pedido, onCancelado }: { pedido: PedidoDto; onCancelado: () => void }) {
  const [canceling, setCanceling] = useState(false);

  function confirmarCancelacion() {
    Alert.alert(
      'Cancelar pedido',
      'Solo podés cancelar mientras el local no confirmó el pedido. ¿Querés continuar?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            setCanceling(true);
            try {
              await cancelarPedido(pedido.id);
              onCancelado();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar el pedido.');
            } finally {
              setCanceling(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={confirmarCancelacion}
        disabled={canceling}
      >
        {canceling
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.cancelBtnText}>Cancelar pedido</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function CalificarSection({ pedido, onCalificado }: { pedido: PedidoDto; onCalificado: () => void }) {
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (estrellas === 0) {
      setError('Seleccioná una calificación.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await crearCalificacion(pedido.id, {
        calificacion: String(estrellas),
        comentario: comentario.trim() || undefined,
      });
      onCalificado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la calificación.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Calificar local</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setEstrellas(n)} hitSlop={8}>
            {n <= estrellas
              ? <StarIconSolid size={32} color="#F59E0B" />
              : <StarIcon size={32} color={Brand.gray400} />
            }
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.comentarioInput}
        placeholder="Comentario (opcional)"
        placeholderTextColor={Brand.gray400}
        value={comentario}
        onChangeText={setComentario}
        multiline
        maxLength={300}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitBtnText}>Enviar calificación</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

export default function PedidoDetail({ pedido: initialPedido }: Props) {
  const [pedido, setPedido] = useState(initialPedido);
  const [calificado, setCalificado] = useState(false);

  const estadoColor = ESTADO_COLOR[pedido.estado];
  const fecha = new Date(pedido.creacion).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  function handleCancelado() {
    setPedido((prev) => ({ ...prev, estado: 'CANCELADO' }));
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeftIcon size={20} color={Brand.gray600} />
        <Text style={styles.backText}>Mis pedidos</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.localNombre}>{pedido.localNombre}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '20', borderColor: estadoColor + '40' }]}>
            <Text style={[styles.estadoText, { color: estadoColor }]}>{ESTADO_LABEL[pedido.estado]}</Text>
          </View>
        </View>
        <Text style={styles.fecha}>{fecha}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {pedido.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemNombre} numberOfLines={1}>{item.cantidad}x {item.nombre}</Text>
            <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${pedido.total.toFixed(2)}</Text>
        </View>
      </View>

      {pedido.direccion && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dirección de entrega</Text>
          <Text style={styles.direccion}>{pedido.direccion}</Text>
          {pedido.indicaciones && (
            <Text style={styles.indicaciones}>{pedido.indicaciones}</Text>
          )}
        </View>
      )}

      {pedido.estado === 'PENDIENTE_CONFIRMACION_LOCAL' && (
        <CancelarSection pedido={pedido} onCancelado={handleCancelado} />
      )}

      {pedido.estado === 'FINALIZADO' && !pedido.tieneCalificacionLocal && !calificado && (
        <CalificarSection pedido={pedido} onCalificado={() => setCalificado(true)} />
      )}

      {pedido.estado === 'FINALIZADO' && (pedido.tieneCalificacionLocal || calificado) && (
        <View style={styles.section}>
          <Text style={styles.yaCalificado}>Ya calificaste este pedido.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  backText: { fontSize: 14, color: Brand.gray600, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  localNombre: { fontSize: 18, fontWeight: '800', color: Brand.black, flex: 1 },
  fecha: { fontSize: 13, color: Brand.gray400 },
  estadoBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  estadoText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Brand.black },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNombre: { fontSize: 14, color: Brand.gray600, flex: 1 },
  itemTotal: { fontSize: 14, color: Brand.gray400, marginLeft: 8 },
  divider: { height: 1, backgroundColor: Brand.gray200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Brand.black },
  totalValue: { fontSize: 15, fontWeight: '700', color: Brand.primary },
  direccion: { fontSize: 14, color: Brand.gray600 },
  indicaciones: { fontSize: 13, color: Brand.gray400 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 4 },
  comentarioInput: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Brand.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: { color: '#DC2626', fontSize: 13 },
  submitBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  yaCalificado: { fontSize: 14, color: Brand.gray400, textAlign: 'center' },
});
