import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TicketIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderDate, formatOrderPrice } from '@/lib/cliente/order-utils';
import type { Voucher, VoucherStatus } from '@/lib/cliente/types';
import { getVouchers } from '@/services/cliente/wallet-service';

const statusLabels: Record<VoucherStatus, string> = {
  DISPONIBLE: 'Disponible',
  USADO: 'Usado',
  VENCIDO: 'Vencido',
};

const statusColors: Record<VoucherStatus, { bg: string; text: string }> = {
  DISPONIBLE: { bg: '#D1FAE5', text: '#065F46' },
  USADO: { bg: '#E5E7EB', text: '#4B5563' },
  VENCIDO: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function WalletPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVouchers()
      .then(setVouchers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Mi billetera</Text>
      <Text style={styles.subtitle}>Vouchers de reclamos aprobados.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vouchers</Text>
        <Text style={styles.sectionSub}>Los vouchers se generan a partir de tus reclamos aprobados.</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator color={Brand.primary} />
        ) : vouchers.length === 0 ? (
          <View style={styles.empty}>
            <TicketIcon size={40} color={Brand.gray400} />
            <Text style={styles.emptyText}>Todavía no tenés vouchers disponibles.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {vouchers.map((voucher) => (
              <View key={voucher.id} style={styles.voucherItem}>
                <View style={styles.voucherIconWrap}>
                  <TicketIcon size={18} color={Brand.primary} />
                </View>
                <View style={styles.voucherInfo}>
                  <View style={styles.voucherHeader}>
                    <Text style={styles.voucherCode}>{voucher.codigo}</Text>
                    <View style={[styles.badge, { backgroundColor: statusColors[voucher.estado].bg }]}>
                      <Text style={[styles.badgeText, { color: statusColors[voucher.estado].text }]}>
                        {statusLabels[voucher.estado]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.voucherLocal}>{voucher.localNombre}</Text>
                  <Text style={styles.voucherDescription}>{voucher.descripcion}</Text>
                  <Text style={styles.voucherExpiry}>Vence el {formatOrderDate(voucher.vencimiento)}</Text>
                </View>
                <Text style={styles.voucherValue}>{formatOrderPrice(voucher.valor)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.black },
  subtitle: { fontSize: 13, color: Brand.gray400, marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Brand.black },
  sectionSub: { fontSize: 12, color: Brand.gray400, marginTop: 2 },
  divider: { height: 1, backgroundColor: Brand.gray200, marginVertical: 14 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyText: { fontSize: 13, color: Brand.gray400 },

  list: { gap: 10 },
  voucherItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  voucherIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherInfo: { flex: 1 },
  voucherHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voucherCode: { fontSize: 13, fontWeight: '700', color: Brand.black },
  voucherLocal: { fontSize: 12, fontWeight: '600', color: Brand.primary, marginTop: 2 },
  voucherDescription: { fontSize: 12, color: Brand.gray600, marginTop: 2 },
  voucherExpiry: { fontSize: 11, color: Brand.gray400, marginTop: 4 },
  voucherValue: { fontSize: 14, fontWeight: '800', color: Brand.primary },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});
