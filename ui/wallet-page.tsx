import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowPathIcon, BanknotesIcon, TicketIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { formatOrderPrice } from '@/lib/cliente/order-utils';
import type { Voucher } from '@/lib/cliente/types';
import { getVouchers } from '@/services/cliente/wallet-service';

type VoucherDisplayStatus = 'available' | 'applied';

function getVoucherStatus(status: string | null | undefined): { key: VoucherDisplayStatus; label: string } {
  const normalized = status?.trim().toLowerCase();

  if (normalized === 'aplicado') return { key: 'applied', label: 'Aplicado' };
  return { key: 'available', label: 'Disponible' };
}

const statusColors: Record<VoucherDisplayStatus, { bg: string; text: string }> = {
  available: { bg: '#D1FAE5', text: '#065F46' },
  applied: { bg: '#E0F2FE', text: '#075985' },
};

function formatExpiry(value: string | null | undefined) {
  if (!value) return 'Sin vencimiento';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getRestaurantLabel(voucher: Voucher) {
  return voucher.restaurantName?.trim() || 'Local no informado';
}

function groupVouchersByRestaurant(vouchers: Voucher[]) {
  const groups = new Map<string, Voucher[]>();

  vouchers.forEach((voucher) => {
    const restaurantName = getRestaurantLabel(voucher);
    groups.set(restaurantName, [...(groups.get(restaurantName) ?? []), voucher]);
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right, 'es'))
    .map(([restaurantName, groupVouchers]) => ({ restaurantName, vouchers: groupVouchers }));
}

export default function WalletPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVouchers(await getVouchers());
    } catch (err) {
      setVouchers([]);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus vouchers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const voucherGroups = useMemo(() => groupVouchersByRestaurant(vouchers), [vouchers]);
  const availableVouchers = useMemo(
    () => vouchers.filter((voucher) => getVoucherStatus(voucher.status).key === 'available'),
    [vouchers],
  );
  const availableBalance = useMemo(
    () => availableVouchers.reduce((total, voucher) => total + (voucher.amount ?? 0), 0),
    [availableVouchers],
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Mi billetera</Text>
      <Text style={styles.subtitle}>Vouchers de reclamos aprobados.</Text>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>No pudimos cargar tu billetera</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <ArrowPathIcon size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconWrap}>
                <BanknotesIcon size={18} color={Brand.primary} />
              </View>
              <Text style={styles.summaryLabel}>Saldo disponible</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : formatOrderPrice(availableBalance)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: '#D1FAE5' }]}>
                <TicketIcon size={18} color="#065F46" />
              </View>
              <Text style={styles.summaryLabel}>Códigos disponibles</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : availableVouchers.length}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vouchers</Text>
            <Text style={styles.sectionSub}>Los vouchers se generan a partir de tus reclamos aprobados.</Text>
            <View style={styles.divider} />

            {loading ? (
              <ActivityIndicator color={Brand.primary} />
            ) : voucherGroups.length === 0 ? (
              <View style={styles.empty}>
                <TicketIcon size={40} color={Brand.gray400} />
                <Text style={styles.emptyText}>Todavía no tenés vouchers disponibles.</Text>
              </View>
            ) : (
              <View style={styles.groupList}>
                {voucherGroups.map((group) => (
                  <View key={group.restaurantName} style={styles.group}>
                    <Text style={styles.groupTitle}>{group.restaurantName}</Text>
                    <View style={styles.list}>
                      {group.vouchers.map((voucher) => {
                        const status = getVoucherStatus(voucher.status);
                        return (
                          <View key={voucher.id} style={styles.voucherItem}>
                            <View style={styles.voucherIconWrap}>
                              <TicketIcon size={18} color={Brand.primary} />
                            </View>
                            <View style={styles.voucherInfo}>
                              <View style={styles.voucherHeader}>
                                <Text style={styles.voucherCode}>{voucher.code}</Text>
                                <View style={[styles.badge, { backgroundColor: statusColors[status.key].bg }]}>
                                  <Text style={[styles.badgeText, { color: statusColors[status.key].text }]}>
                                    {status.label}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.voucherDescription}>{voucher.description}</Text>
                              <Text style={styles.voucherExpiry}>Vence el {formatExpiry(voucher.expiresAt)}</Text>
                            </View>
                            <Text style={styles.voucherValue}>{formatOrderPrice(voucher.amount)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.black },
  subtitle: { fontSize: 13, color: Brand.gray400, marginTop: 4 },

  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: Brand.black },
  errorText: { fontSize: 13, color: Brand.gray600 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Brand.black,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 11, color: Brand.gray400 },
  summaryValue: { fontSize: 17, fontWeight: '800', color: Brand.black },

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

  groupList: { gap: 18 },
  group: { gap: 10 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Brand.primary },
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
  voucherDescription: { fontSize: 12, color: Brand.gray600, marginTop: 2 },
  voucherExpiry: { fontSize: 11, color: Brand.gray400, marginTop: 4 },
  voucherValue: { fontSize: 14, fontWeight: '800', color: Brand.primary },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});
