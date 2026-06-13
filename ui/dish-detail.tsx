import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
} from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import { notifyCartRefresh } from "@/lib/cliente/cart-refresh";
import { getActiveCartItems, getCartItemCount } from "@/lib/cliente/cart-utils";
import type { Cart, ClientDish, Discount } from "@/lib/cliente/types";
import { getCart, getDish, getDishDiscount, getRestaurantName, updateCartItem } from "@/services/cliente/cliente-service";


function DishDetailSkeleton() {
  return (
    <ScrollView style={styles.root}>
      <View style={styles.skeletonImg} />
      <View style={styles.card}>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={[styles.skeletonLine, { width: "70%", height: 24 }]} />
          <View style={[styles.skeletonLine, { width: "30%", height: 28 }]} />
          <View style={[styles.skeletonLine, { width: "50%" }]} />
        </View>
      </View>
    </ScrollView>
  );
}


export default function DishDetailScreen({ id }: { id: string }) {
  const [dish, setDish] = useState<ClientDish | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(true);
  const cartUpdateInFlight = useRef(false);

  useEffect(() => {
    getDish(id)
      .then((d) => {
        setDish(d);
        getCart(d.localId).then(setCart).catch(() => setCart(null));
        getDishDiscount(Number(d.id))
          .then(setDiscount)
          .catch(() => setDiscount(null))
          .finally(() => setDiscountLoading(false));
        return getRestaurantName(d.localId);
      })
      .then(setLocalName)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  const qty = dish
    ? getActiveCartItems(cart).find((i) => i.platoId === Number(dish.id))?.cantidad ?? 0
    : 0;
  const cartItemCount = getCartItemCount(cart);

  async function handleCartUpdate(delta: number) {
    if (!dish || cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setIsUpdating(true);
    try {
      const updated = await updateCartItem(dish.localId, Number(dish.id), delta);
      const hasActiveItems = getActiveCartItems(updated).length > 0;
      setCart(hasActiveItems ? updated : null);
      setCartError(null);
      notifyCartRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar el carrito";
      console.warn("[carrito] error en updateCartItem:", err);
      setCartError(message);
    } finally {
      cartUpdateInFlight.current = false;
      setIsUpdating(false);
    }
  }

  if (loading) return <DishDetailSkeleton />;

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!dish) return null;

  const available = dish.status === "available";
  const discountedPrice = discount
    ? Math.round(dish.price * (1 - discount.porcentaje / 100) * 100) / 100
    : null;

  return (
    <View style={styles.root}>
      {/* Cabecera fija */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={cartItemCount > 0 ? styles.bodyWithCart : undefined}
      >
        {/* Imagen */}
        <View style={styles.imgWrapper}>
          {dish.imageUrl ? (
            <Image
              source={{ uri: dish.imageUrl }}
              style={styles.img}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imgPlaceholder}>
              {dish.name.charAt(0).toUpperCase()}
            </Text>
          )}
          {!discountLoading && discount && (
            <View style={styles.discountBadge}>
              <TagIcon size={14} color="#fff" />
              <Text style={styles.discountBadgeText}>-{discount.porcentaje}%</Text>
            </View>
          )}
        </View>

        {/* Ficha */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.dishName}>{dish.name}</Text>
            <View style={[styles.statusBadge, available ? styles.badgeAvailable : styles.badgeUnavailable]}>
              <Text style={[styles.statusText, available ? styles.statusTextAvailable : styles.statusTextUnavailable]}>
                {available ? "Disponible" : "No disponible"}
              </Text>
            </View>
          </View>

          {discountedPrice != null ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>${discountedPrice}</Text>
              <Text style={styles.originalPrice}>${dish.price}</Text>
            </View>
          ) : (
            <Text style={styles.price}>${dish.price}</Text>
          )}

          {localName ? (
            <Text style={styles.localName}>{localName}</Text>
          ) : null}

          {cartError ? (
            <Text style={styles.cartErrorText}>{cartError}</Text>
          ) : null}

          {qty === 0 ? (
            <TouchableOpacity
              disabled={!available || isUpdating}
              style={[styles.cartBtn, (!available || isUpdating) && styles.cartBtnDisabled]}
              activeOpacity={0.85}
              onPress={() => handleCartUpdate(1)}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ShoppingCartIcon size={20} color="#fff" />
                  <Text style={styles.cartBtnText}>Agregar al carrito</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                disabled={isUpdating}
                onPress={() => handleCartUpdate(-1)}
                style={styles.qtyBtn}
              >
                <MinusIcon size={18} color={Brand.primary} />
              </TouchableOpacity>
              {isUpdating ? (
                <ActivityIndicator color={Brand.primary} />
              ) : (
                <Text style={styles.qtyText}>{qty}</Text>
              )}
              <TouchableOpacity
                disabled={isUpdating}
                onPress={() => handleCartUpdate(1)}
                style={styles.qtyBtn}
              >
                <PlusIcon size={18} color={Brand.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {cartItemCount > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartBarInner}>
            <View style={styles.cartBarLeft}>
              <View>
                <ShoppingCartIcon size={24} color="#fff" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.cartBarTitle}>Tu pedido</Text>
                <Text style={styles.cartBarTotal}>${cart?.total.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cartBarBtn}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/local/[id]/cart",
                  params: { id: String(dish.localId) },
                })
              }
            >
              <Text style={styles.cartBarBtnText}>Ver carrito</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 14, color: Brand.gray600 },

  imgWrapper: { height: 240, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center", position: "relative" },
  img: { width: "100%", height: "100%" },
  imgPlaceholder: { fontSize: 80, fontWeight: "900", color: Brand.primary },

  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Brand.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  card: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20, gap: 8, minHeight: 300 },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  dishName: { fontSize: 22, fontWeight: "800", color: Brand.black, flex: 1 },

  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  badgeAvailable: { backgroundColor: "#D1FAE5" },
  badgeUnavailable: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 11, fontWeight: "600" },
  statusTextAvailable: { color: "#065F46" },
  statusTextUnavailable: { color: "#6B7280" },

  price: { fontSize: 28, fontWeight: "900", color: Brand.primary, marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4 },
  originalPrice: { fontSize: 16, color: Brand.gray400, textDecorationLine: "line-through" },
  localName: { fontSize: 13, color: Brand.gray400, marginTop: 2 },

  cartBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
  cartBtnDisabled: { opacity: 0.5 },
  cartBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
  },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 18, fontWeight: "800", color: Brand.primary },

  errorBanner: { margin: 16, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 16 },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },
  cartErrorText: { color: "#DC2626", fontSize: 12, marginTop: 8 },

  skeletonImg: { height: 240, backgroundColor: Brand.gray200 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },

  bodyWithCart: { paddingBottom: 88 },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  cartBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, fontWeight: "700", color: Brand.primary },
  cartBarTitle: { fontSize: 13, fontWeight: "600", color: "#fff" },
  cartBarTotal: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  cartBarBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cartBarBtnText: { fontSize: 13, fontWeight: "700", color: Brand.primary },
});
