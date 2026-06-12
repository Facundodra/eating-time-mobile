import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowRightIcon,
  ShoppingCartIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { getActiveCartItems } from '@/lib/cliente/cart-utils';
import type { Cart } from '@/lib/cliente/types';
import { deleteCart, getCarts, getRestaurantName } from '@/services/cliente/cliente-service';

type CartWithName = Cart & { restaurantName: string };

function CartCardSkeleton() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <View style={[styles.skeletonLine, { width: '50%', height: 16 }]} />
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '40%' }]} />
    </View>
  );
}

export default function CartsPage() {
  const [carts, setCarts] = useState<CartWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rawCarts = await getCarts();
        const cartsWithNames = await Promise.all(
          rawCarts.map(async (cart) => {
            const restaurantName = await getRestaurantName(cart.restaurantId).catch(
              () => `Restaurante #${cart.restaurantId}`,
            );
            return { ...cart, restaurantName };
          }),
        );
        setCarts(cartsWithNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los carritos.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleDelete(restaurantId: number) {
    setDeletingRestaurantId(restaurantId);
    try {
      await deleteCart(restaurantId);
      setCarts((prev) => prev.filter((c) => c.restaurantId !== restaurantId));
    } finally {
      setDeletingRestaurantId(null);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mis carritos</Text>

      {loading && (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <CartCardSkeleton key={i} />
          ))}
        </View>
      )}

      {!loading && error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && carts.length === 0 && (
        <View style={styles.empty}>
          <ShoppingCartIcon size={56} color={Brand.gray400} />
          <Text style={styles.emptyText}>No tenés carritos activos.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.emptyLink}>Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && carts.length > 0 && (
        <View style={styles.list}>
          {carts.map((cart) => {
            const isDeleting = deletingRestaurantId === cart.restaurantId;
            const activeItems = getActiveCartItems(cart);

            return (
              <View key={cart.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.iconCircle}>
                      <ShoppingCartIcon size={20} color={Brand.primary} />
                    </View>
                    <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(cart.restaurantId)}
                    disabled={isDeleting}
                    style={styles.deleteBtn}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <TrashIcon size={18} color={Brand.gray400} />
                    )}
                  </TouchableOpacity>
                </View>

                {activeItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemText}>
                      {item.cantidad}x {item.nombre ?? `Plato #${item.platoId}`}
                    </Text>
                    <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.cardFooter}>
                  <Text style={styles.total}>Total: ${cart.total.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/local/[id]/cart',
                        params: { id: String(cart.restaurantId) },
                      })
                    }
                  >
                    <Text style={styles.continueBtnText}>Continuar pedido</Text>
                    <ArrowRightIcon size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '800', color: Brand.black, marginBottom: 16 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantName: { fontSize: 16, fontWeight: '700', color: Brand.black, flexShrink: 1 },
  deleteBtn: { padding: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 4 },
  itemText: { fontSize: 13, color: Brand.gray600, flex: 1 },
  itemPrice: { fontSize: 13, color: Brand.gray400 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Brand.gray100,
    paddingTop: 12,
    marginTop: 4,
  },
  total: { fontSize: 15, fontWeight: '700', color: Brand.primary },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  continueBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Brand.gray400 },
  emptyLink: { fontSize: 14, fontWeight: '600', color: Brand.primary },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  skeleton: { gap: 10 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },
});
