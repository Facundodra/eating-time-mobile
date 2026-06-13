import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderPrice } from '@/lib/cliente/order-utils';
import type { Order } from '@/lib/cliente/types';

const SUPPORT_EMAIL = 'eating.time.soporte@gmail.com';

type Props = {
  visible: boolean;
  order: Order | null;
  restaurantName: string;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelOrderModal({
  visible,
  order,
  restaurantName,
  isProcessing,
  onClose,
  onConfirm,
}: Props) {
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={isProcessing ? undefined : onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Cancelar pedido</Text>
              <Text style={styles.title}>Pedido #{order.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isProcessing} style={styles.closeBtn}>
              <XMarkIcon size={22} color={Brand.gray400} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.restaurant}>{restaurantName}</Text>
            <Text style={styles.totalLabel}>Total: {formatOrderPrice(order.total)}</Text>

            <Text style={styles.question}>
              ¿Estás seguro de que querés{' '}
              <Text style={styles.cancelWord}>cancelar</Text> el pedido?
            </Text>
            <Text style={styles.paragraph}>
              Una vez cancelado, el restaurante ya no podrá ver tu pedido.
            </Text>
            <Text style={styles.paragraph}>
              Para tu <Text style={styles.bold}>reembolso</Text>, ponete en contacto con el
              equipo de soporte de{' '}
              <Text style={styles.bold}>
                Eating<Text style={styles.brandAccent}>Time</Text>
              </Text>
              :{' '}
              <Text
                style={styles.link}
                onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              >
                {SUPPORT_EMAIL}
              </Text>
              {' '}y especificá el número de pedido y cómo querés que se te reembolse tu dinero
              (cupón o transferencia).
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} disabled={isProcessing}>
              <Text style={styles.backBtnText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, isProcessing && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Sí, cancelar pedido</Text>
              )}
            </TouchableOpacity>
          </View>
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
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: Brand.black,
  },
  closeBtn: { padding: 4 },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  restaurant: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.black,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  question: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.black,
    lineHeight: 20,
    marginTop: 4,
  },
  cancelWord: { color: '#DC2626' },
  paragraph: {
    fontSize: 13,
    color: Brand.gray600,
    lineHeight: 19,
  },
  bold: { fontWeight: '800', color: Brand.gray800 },
  brandAccent: { color: Brand.primary },
  link: {
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.gray200,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.gray800,
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
