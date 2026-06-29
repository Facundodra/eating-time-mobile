import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { notifyCartRefresh } from '@/lib/cliente/cart-refresh';
import { getActiveCartItems, isActiveCart } from '@/lib/cliente/cart-utils';
import { formatOrderPrice } from '@/lib/cliente/order-utils';
import type { AppliedCartCoupon, Cart, DeliveryPoint, OrderRequest, Restaurant, Voucher } from '@/lib/cliente/types';
import {
  applyCartCoupon,
  applyCartVoucher,
  deleteCart,
  deliveryPointService,
  getCart,
  getRestaurant,
  placeOrder,
  removeCartCoupon,
  removeCartVoucher,
  updateCartItem,
} from '@/services/cliente/cliente-service';
import { getAvailableVouchers } from '@/services/cliente/wallet-service';

type AddressMode = 'saved' | 'manual';

function CheckoutSection({
  restaurantId,
  cart,
  onCartChange,
  onSuccess,
}: {
  restaurantId: number;
  cart: Cart;
  onCartChange: (cart: Cart) => void;
  onSuccess: () => void;
}) {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [mode, setMode] = useState<AddressMode>('saved');
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [localidad, setLocalidad] = useState('');
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [nroApto, setNroApto] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [guardarEnCuenta, setGuardarEnCuenta] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applyingVoucherId, setApplyingVoucherId] = useState<string | null>(null);
  const [removingVoucher, setRemovingVoucher] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingCoupon, setRemovingCoupon] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getSession } = await import('@/lib/auth/session');
        const session = await getSession();
        if (!session?.user?.roleId) {
          setMode('manual');
          return;
        }
        const pts = await deliveryPointService.getDeliveryPoints(session.user.roleId);
        setDeliveryPoints(pts);
        if (pts.length === 0) {
          setMode('manual');
        } else {
          setSelectedPointId(pts[0].id);
        }
      } catch {
        setMode('manual');
      } finally {
        setLoadingPoints(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    setLoadingVouchers(true);
    getAvailableVouchers(restaurantId)
      .then(setAvailableVouchers)
      .catch(() => setAvailableVouchers([]))
      .finally(() => setLoadingVouchers(false));
  }, [restaurantId]);

  const activeItems = getActiveCartItems(cart);
  const itemsSubtotal = activeItems.reduce((sum, item) => sum + item.total, 0);
  const couponDiscount = cart.descuento ?? 0;
  const subtotalAfterCoupon = Math.max(0, itemsSubtotal - couponDiscount);
  const hasDiscount = cart.total < itemsSubtotal;

  const appliedCoupon: AppliedCartCoupon | null =
    cart.cuponId != null && cart.cuponCodigo && cart.cuponPorcentaje != null
      ? { code: cart.cuponCodigo, percentage: cart.cuponPorcentaje, discountAmount: couponDiscount }
      : null;

  const appliedVoucher =
    cart.voucherId != null
      ? availableVouchers.find((voucher) => voucher.id === String(cart.voucherId)) ?? null
      : null;

  const voucherExceedsOrder =
    appliedVoucher?.amount != null && appliedVoucher.amount > subtotalAfterCoupon;

  async function handleApplyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const updated = await applyCartCoupon(restaurantId, code);
      onCartChange(updated);
      setCouponCode('');
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'No se pudo aplicar el cup?n.');
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleRemoveCoupon() {
    setRemovingCoupon(true);
    setCouponError(null);
    try {
      onCartChange(await removeCartCoupon(restaurantId));
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'No se pudo quitar el cup?n.');
    } finally {
      setRemovingCoupon(false);
    }
  }

  async function handleApplyVoucher(voucher: Voucher) {
    setApplyingVoucherId(voucher.id);
    setVoucherError(null);
    try {
      onCartChange(await applyCartVoucher(restaurantId, Number(voucher.id)));
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'No se pudo aplicar el voucher.');
    } finally {
      setApplyingVoucherId(null);
    }
  }

  async function handleRemoveVoucher() {
    setRemovingVoucher(true);
    setVoucherError(null);
    try {
      onCartChange(await removeCartVoucher(restaurantId));
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'No se pudo quitar el voucher.');
    } finally {
      setRemovingVoucher(false);
    }
  }

  async function handleConfirm() {
    setError(null);

    let body: OrderRequest;

    if (mode === 'saved' && selectedPointId != null) {
      body = { puntoDeEntregaId: selectedPointId };
    } else {
      if (!localidad || !calle || !numero) {
        setError('Localidad, calle y n?mero son obligatorios.');
        return;
      }
      body = {
        localidad,
        calle,
        numero,
        nroApto: nroApto || undefined,
        indicaciones: indicaciones || undefined,
        guardarEnCuenta,
      };
    }

    setPlacing(true);
    try {
      const { linkPago } = await placeOrder(restaurantId, body);
      onSuccess();
      notifyCartRefresh();
      // Navegar primero para que el polling arranque mientras el usuario paga en MP
      router.replace({
        pathname: '/(tabs)/pedidos/resultado',
        params: {
          pedidoId: String(cart.id),
          localId: String(restaurantId),
        },
      });
      await WebBrowser.openAuthSessionAsync(linkPago, 'eatingtime://');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo realizar el pedido.';
      const lower = message.toLowerCase();
      if (lower.includes('venc')) {
        setError('El voucher ya no es v?lido. Quit? el voucher aplicado e intent? realizar el pedido nuevamente.');
      } else if (lower.includes('cup?n') || lower.includes('cupon')) {
        setError('El cup?n ya no es v?lido. Quit? el cup?n aplicado e intent? realizar el pedido nuevamente.');
      } else {
        setError(message);
      }
    } finally {
      setPlacing(false);
    }
  }

  if (loadingPoints) {
    return (
      <View style={styles.checkoutLoading}>
        <ActivityIndicator color={Brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.checkout}>
      <Text style={styles.checkoutTitle}>Direcci?n de entrega</Text>

      {deliveryPoints.length > 0 && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'saved' && styles.modeBtnActive]}
            onPress={() => setMode('saved')}
          >
            <Text style={[styles.modeBtnText, mode === 'saved' && styles.modeBtnTextActive]}>
              Puntos guardados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
              Nueva direcci?n
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'saved' &&
        deliveryPoints.map((pt) => (
          <TouchableOpacity
            key={pt.id}
            style={[styles.pointCard, selectedPointId === pt.id && styles.pointCardSelected]}
            onPress={() => setSelectedPointId(pt.id)}
          >
            <Text style={styles.pointMain}>
              {pt.calle} {pt.numero}
              {pt.nroApto ? `, Apto ${pt.nroApto}` : ''}
            </Text>
            <Text style={styles.pointSub}>{pt.localidad}</Text>
            {pt.indicaciones ? <Text style={styles.pointHint}>{pt.indicaciones}</Text> : null}
          </TouchableOpacity>
        ))}

      {mode === 'manual' && (
        <View style={styles.form}>
          <Text style={styles.label}>Localidad *</Text>
          <TextInput style={styles.input} value={localidad} onChangeText={setLocalidad} placeholder="Ej: Montevideo" />

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.label}>Calle *</Text>
              <TextInput style={styles.input} value={calle} onChangeText={setCalle} placeholder="Ej: Av. Italia" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.label}>N?mero *</Text>
              <TextInput style={styles.input} value={numero} onChangeText={setNumero} placeholder="2547" />
            </View>
          </View>

          <Text style={styles.label}>Apto</Text>
          <TextInput style={styles.input} value={nroApto} onChangeText={setNroApto} placeholder="Ej: 302" />

          <Text style={styles.label}>Indicaciones</Text>
          <TextInput
            style={styles.input}
            value={indicaciones}
            onChangeText={setIndicaciones}
            placeholder="Ej: Tocar timbre"
          />

          <View style={styles.switchRow}>
            <Switch value={guardarEnCuenta} onValueChange={setGuardarEnCuenta} trackColor={{ true: Brand.primary }} />
            <Text style={styles.switchLabel}>Guardar esta direcci?n en mi cuenta</Text>
          </View>
        </View>
      )}

      <View style={styles.discountSection}>
        <Text style={styles.checkoutTitle}>Cup?n de descuento</Text>

        {appliedCoupon ? (
          <View style={styles.discountApplied}>
            <View style={styles.discountAppliedInfo}>
              <Text style={styles.discountAppliedLabel}>
                Cup?n {appliedCoupon.code} ({appliedCoupon.percentage}%)
              </Text>
              <Text style={styles.discountAppliedAmount}>-{formatOrderPrice(appliedCoupon.discountAmount)}</Text>
            </View>
            <TouchableOpacity onPress={handleRemoveCoupon} disabled={removingCoupon}>
              {removingCoupon ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.discountRemove}>Quitar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.input, styles.couponInput]}
                placeholder="C?digo de cup?n"
                placeholderTextColor={Brand.gray400}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  setCouponError(null);
                }}
              />
              <TouchableOpacity
                style={[styles.couponBtn, (!couponCode.trim() || applyingCoupon) && styles.confirmBtnDisabled]}
                disabled={!couponCode.trim() || applyingCoupon}
                onPress={handleApplyCoupon}
              >
                {applyingCoupon ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.couponBtnText}>Aplicar</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError ? <Text style={styles.checkoutError}>{couponError}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.discountSection}>
        <Text style={styles.checkoutTitle}>Vouchers para este local</Text>

        {loadingVouchers ? (
          <ActivityIndicator color={Brand.primary} />
        ) : appliedVoucher ? (
          <View style={styles.discountApplied}>
            <View style={styles.discountAppliedInfo}>
              <Text style={styles.discountAppliedLabel}>Voucher {appliedVoucher.code}</Text>
              <Text style={styles.discountAppliedAmount}>-{formatOrderPrice(appliedVoucher.amount)}</Text>
            </View>
            <TouchableOpacity onPress={handleRemoveVoucher} disabled={removingVoucher}>
              {removingVoucher ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.discountRemove}>Quitar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : availableVouchers.length === 0 ? (
          <Text style={styles.label}>No ten?s vouchers disponibles para este local.</Text>
        ) : (
          <View style={styles.voucherList}>
            {availableVouchers.map((voucher) => {
              const isApplying = applyingVoucherId === voucher.id;
              return (
                <TouchableOpacity
                  key={voucher.id}
                  style={styles.pointCard}
                  disabled={isApplying}
                  onPress={() => handleApplyVoucher(voucher)}
                >
                  <View style={styles.voucherOptionRow}>
                    <Text style={styles.pointMain}>
                      {voucher.code} ? {formatOrderPrice(voucher.amount)}
                    </Text>
                    {isApplying && <ActivityIndicator size="small" color={Brand.primary} />}
                  </View>
                  {voucher.description ? <Text style={styles.pointSub}>{voucher.description}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {voucherError ? <Text style={styles.checkoutError}>{voucherError}</Text> : null}
        {voucherExceedsOrder ? (
          <Text style={styles.checkoutError}>El monto del voucher supera el total de tu pedido.</Text>
        ) : null}
      </View>

      {hasDiscount && (
        <View style={styles.totalPreview}>
          <Text style={styles.totalPreviewLabel}>Total a pagar</Text>
          <View style={styles.totalPreviewValues}>
            <Text style={styles.totalPreviewOriginal}>${itemsSubtotal.toFixed(2)}</Text>
            <Text style={styles.totalPreviewFinal}>${cart.total.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {error ? <Text style={styles.checkoutError}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.confirmBtn, (placing || (mode === 'saved' && selectedPointId == null)) && styles.confirmBtnDisabled]}
        disabled={placing || (mode === 'saved' && selectedPointId == null)}
        onPress={handleConfirm}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <CheckCircleIcon size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirmar y pagar</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function RestaurantCartPage({ restaurantId }: { restaurantId: number }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingDishId, setUpdatingDishId] = useState<number | null>(null);
  const [deletingCart, setDeletingCart] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cartUpdateInFlight = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'focus' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else if (mode === 'initial') {
      setLoading(true);
    }

    const [cartData, restaurantData] = await Promise.allSettled([
      getCart(restaurantId),
      getRestaurant(String(restaurantId)),
    ]);

    if (cartData.status === 'fulfilled') setCart(cartData.value);
    if (restaurantData.status === 'fulfilled') setRestaurant(restaurantData.value);
    if (mode === 'refresh') notifyCartRefresh();
    setLoading(false);
    setRefreshing(false);
  }, [restaurantId]);

  useFocusEffect(
    useCallback(() => {
      load('focus');
    }, [load]),
  );

  async function handleUpdateItem(platoId: number, delta: number) {
    if (cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setUpdatingDishId(platoId);
    try {
      const updated = await updateCartItem(restaurantId, platoId, delta);
      setCart(isActiveCart(updated) ? updated : null);
      if (!isActiveCart(updated)) setCheckoutOpen(false);
      notifyCartRefresh();
    } finally {
      cartUpdateInFlight.current = false;
      setUpdatingDishId(null);
    }
  }

  async function handleDeleteCart() {
    setDeletingCart(true);
    try {
      await deleteCart(restaurantId);
      setCart(null);
      setCheckoutOpen(false);
      notifyCartRefresh();
    } finally {
      setDeletingCart(false);
    }
  }

  const activeItems = getActiveCartItems(cart);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load('refresh')}
          tintColor={Brand.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backLink}
        onPress={() =>
          router.push({ pathname: '/(tabs)/local/[id]', params: { id: String(restaurantId) } })
        }
      >
        <ArrowLeftIcon size={16} color={Brand.gray400} />
        <Text style={styles.backText}>Volver a {restaurant?.name ?? 'el restaurante'}</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Tu carrito</Text>
        {isActiveCart(cart) && (
          <TouchableOpacity onPress={handleDeleteCart} disabled={deletingCart} style={styles.vaciarBtn}>
            {deletingCart ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <TrashIcon size={16} color={Brand.gray400} />
                <Text style={styles.vaciarText}>Vaciar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[styles.itemCard, styles.skeleton]} />
          ))}
        </View>
      )}

      {!loading && !isActiveCart(cart) && (
        <View style={styles.empty}>
          <ShoppingCartIcon size={56} color={Brand.gray400} />
          <Text style={styles.emptyText}>Tu carrito est? vac?o.</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/(tabs)/local/[id]', params: { id: String(restaurantId) } })
            }
          >
            <Text style={styles.emptyLink}>Ver platos del restaurante</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && isActiveCart(cart) && (
        <>
          {activeItems.map((item) => {
            const isUpdating = updatingDishId === item.platoId;
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.nombre ?? `Plato #${item.platoId}`}
                  </Text>
                  <Text style={styles.itemUnit}>${item.costoUnitario.toFixed(2)} c/u</Text>
                </View>

                <View style={styles.itemActions}>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateItem(item.platoId, -1)}
                      style={styles.qtyBtn}
                    >
                      <MinusIcon size={14} color={Brand.primary} />
                    </TouchableOpacity>

                    {isUpdating ? (
                      <ActivityIndicator size="small" color={Brand.primary} />
                    ) : (
                      <Text style={styles.qtyText}>{item.cantidad}</Text>
                    )}

                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateItem(item.platoId, 1)}
                      style={styles.qtyBtn}
                    >
                      <PlusIcon size={14} color={Brand.primary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${cart.total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.orderBtn} onPress={() => setCheckoutOpen((v) => !v)}>
                <Text style={styles.orderBtnText}>Realizar pedido</Text>
                <ChevronDownIcon
                  size={16}
                  color="#fff"
                  style={{ transform: [{ rotate: checkoutOpen ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            </View>

            {checkoutOpen && (
              <CheckoutSection
                restaurantId={restaurantId}
                cart={cart}
                onCartChange={setCart}
                onSuccess={() => setCart(null)}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 13, color: Brand.gray400 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Brand.black },
  vaciarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  vaciarText: { fontSize: 13, color: Brand.gray400 },
  loadingList: { gap: 10 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Brand.black },
  itemUnit: { fontSize: 11, color: Brand.gray400, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: { padding: 4 },
  qtyText: { fontSize: 14, fontWeight: '700', color: Brand.primary, minWidth: 18, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Brand.black, minWidth: 60, textAlign: 'right' },
  totalCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginTop: 6,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, color: Brand.gray400 },
  totalValue: { fontSize: 24, fontWeight: '900', color: Brand.primary },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orderBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkout: { marginTop: 16, gap: 12 },
  checkoutTitle: { fontSize: 14, fontWeight: '600', color: Brand.gray800 },
  checkoutLoading: { paddingVertical: 24, alignItems: 'center' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.gray200,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: Brand.gray600 },
  modeBtnTextActive: { color: '#fff' },
  pointCard: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  pointCardSelected: { borderColor: Brand.primary, backgroundColor: '#FFF7ED' },
  pointMain: { fontSize: 14, fontWeight: '600', color: Brand.black },
  pointSub: { fontSize: 12, color: Brand.gray400, marginTop: 2 },
  pointHint: { fontSize: 11, color: Brand.gray400, marginTop: 2 },
  form: { gap: 8 },
  formRow: { flexDirection: 'row', gap: 8 },
  formCol: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', color: Brand.gray600, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.black,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  switchLabel: { fontSize: 13, color: Brand.gray600, flex: 1 },
  discountSection: { gap: 8 },
  voucherList: { gap: 8 },
  voucherOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, marginBottom: 0 },
  couponBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    padding: 12,
  },
  discountAppliedInfo: { flex: 1 },
  discountAppliedLabel: { fontSize: 13, fontWeight: '600', color: Brand.black },
  discountAppliedAmount: { fontSize: 14, fontWeight: '800', color: Brand.primary, marginTop: 2 },
  discountRemove: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  totalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalPreviewLabel: { fontSize: 12, color: Brand.gray600 },
  totalPreviewValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalPreviewOriginal: { fontSize: 13, color: Brand.gray400, textDecorationLine: 'line-through' },
  totalPreviewFinal: { fontSize: 16, fontWeight: '800', color: Brand.primary },
  checkoutError: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Brand.gray400 },
  emptyLink: { fontSize: 14, fontWeight: '600', color: Brand.primary },
  skeleton: { height: 72, backgroundColor: Brand.gray200 },
});
