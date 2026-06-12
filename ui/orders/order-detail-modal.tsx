import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderDate, formatOrderPrice, statusColors, statusLabels } from '@/lib/cliente/order-utils';
import type { Order } from '@/lib/cliente/types';
import { cancelOrder } from '@/services/cliente/cliente-service';

type Props = {
  visible: boolean;
  order: Order | null;
  restaurantName: string;
  onClose: () => void;
  onOrderUpdated: (order: Order) => void;
};

function activeItems(order: Order) {
  return order.items.filter((item) => item.eliminacion == null);
}

function InfoBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function OrderDetailModal({
  visible,
  order,
  restaurantName,
  onClose,
  onOrderUpdated,
}: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!order) return null;

  const items = activeItems(order);
  const canCancel = order.estado === 'PENDIENTE_CONFIRMACION_LOCAL';
  const statusStyle = statusColors[order.estado];

  function confirmCancel() {
    Alert.alert(
      'Cancelar pedido',
      '¿Estás seguro de que querés cancelar este pedido? El local será notificado y no se realizará reembolso automático.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => void handleCancel(),
        },
      ],
    );
  }

  async function handleCancel() {
    if (!order) return;
    const orderId = order.id;
    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await cancelOrder(orderId);
      onOrderUpdated(updated);
      onClose();
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'No se pudo cancelar el pedido.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Detalle del pedido</Text>
              <Text style={styles.title}>Pedido #{order.id}</Text>
              <Text style={styles.subtitle}>
                {restaurantName} · {formatOrderDate(order.creacion)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <XMarkIcon size={22} color={Brand.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Estado</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {statusLabels[order.estado]}
                  </Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Items</Text>
                <Text style={styles.statValue}>
                  {items.reduce((sum, item) => sum + item.cantidad, 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={[styles.statValue, styles.totalValue]}>{formatOrderPrice(order.total)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platos</Text>
              {items.length === 0 ? (
                <Text style={styles.emptyItems}>No hay items para mostrar.</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemName}>{item.nombre ?? `Plato #${item.platoId}`}</Text>
                      {item.descuentoAplicado > 0 ? (
                        <Text style={styles.itemDiscount}>
                          Descuento aplicado: {formatOrderPrice(item.descuentoAplicado)}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemMeta}>x{item.cantidad}</Text>
                    <Text style={styles.itemMeta}>{formatOrderPrice(item.costoUnitario)}</Text>
                    <Text style={styles.itemTotal}>{formatOrderPrice(item.total)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.infoGrid}>
              <InfoBlock label="Dirección" value={order.direccion} />
              <InfoBlock label="Indicaciones" value={order.indicaciones} />
              <InfoBlock label="Comentario" value={order.comentario} />
              <InfoBlock label="Motivo de rechazo" value={order.motivoRechazo} />
              <InfoBlock label="Tiempo estimado" value={order.tiempoEstimado} />
              <InfoBlock
                label="Descuento"
                value={order.descuento != null ? formatOrderPrice(order.descuento) : null}
              />
            </View>

            {order.urlFactura ? (
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={() => void Linking.openURL(order.urlFactura!)}
              >
                <Text style={styles.invoiceBtnText}>Ver factura</Text>
              </TouchableOpacity>
            ) : null}

            {canCancel ? (
              <View style={styles.cancelSection}>
                <Text style={styles.cancelHint}>
                  Este pedido aún no fue confirmado por el local. Podés cancelarlo.
                </Text>
                {cancelError ? <Text style={styles.cancelError}>{cancelError}</Text> : null}
                <TouchableOpacity
                  style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                  onPress={confirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.cancelBtnText}>Cancelar pedido</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 18,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray200,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    color: Brand.black,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.gray400,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Brand.gray100,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Brand.gray200,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: Brand.black,
  },
  totalValue: {
    color: Brand.primary,
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.black,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray200,
    backgroundColor: '#FAFAFA',
  },
  emptyItems: {
    padding: 16,
    fontSize: 13,
    color: Brand.gray400,
  },
  itemRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray100,
    gap: 4,
  },
  itemMain: {
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.black,
  },
  itemDiscount: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  itemMeta: {
    fontSize: 12,
    color: Brand.gray400,
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: Brand.black,
  },
  infoGrid: {
    gap: 8,
    marginBottom: 12,
  },
  infoBlock: {
    backgroundColor: Brand.gray100,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.gray800,
  },
  invoiceBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  invoiceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  cancelSection: {
    marginTop: 4,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelHint: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    marginBottom: 10,
  },
  cancelError: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
  },
  cancelBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
