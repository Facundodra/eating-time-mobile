import {
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
import { claimStatusColors, claimStatusLabels } from '@/lib/cliente/claim-utils';
import { formatOrderDate } from '@/lib/cliente/order-utils';
import type { OrderClaim } from '@/lib/cliente/types';

type Props = {
  visible: boolean;
  claim: OrderClaim | null;
  restaurantName?: string;
  onClose: () => void;
};

export default function ViewClaimModal({ visible, claim, restaurantName, onClose }: Props) {
  if (!claim) return null;

  const displayRestaurantName =
    restaurantName ?? claim.localNombre ?? 'Local no disponible';
  const statusStyle = claimStatusColors[claim.estado];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Reclamo del pedido</Text>
              <Text style={styles.title}>Pedido #{claim.pedidoId}</Text>
              <Text style={styles.subtitle}>{displayRestaurantName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <XMarkIcon size={22} color={Brand.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {claimStatusLabels[claim.estado]}
                </Text>
              </View>
              <Text style={styles.sentDate}>Enviado el {formatOrderDate(claim.creacion)}</Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>Tu reclamo</Text>
              <Text style={styles.blockValue}>{claim.descripcion}</Text>
            </View>

            {claim.nota ? (
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Respuesta del restaurante</Text>
                <Text style={styles.blockValue}>{claim.nota}</Text>
              </View>
            ) : null}

            {claim.estado === 'PENDIENTE' ? (
              <Text style={styles.pendingHint}>
                El restaurante está revisando tu reclamo. Te avisaremos cuando haya una
                resolución.
              </Text>
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
  headerText: { flex: 1, paddingRight: 12 },
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
  closeBtn: { padding: 4 },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statusRow: {
    gap: 8,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sentDate: {
    fontSize: 12,
    color: Brand.gray400,
  },
  block: {
    backgroundColor: Brand.gray100,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    marginBottom: 10,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  blockValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Brand.gray800,
    lineHeight: 20,
  },
  pendingHint: {
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
    marginTop: 4,
  },
});
