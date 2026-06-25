import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  MapPinIcon,
  MoonIcon,
  ShoppingCartIcon,
  StarIcon,
} from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import { getCartItemCount } from "@/lib/cliente/cart-utils";
import type { Cart, Restaurant } from "@/lib/cliente/types";
import { getCart, getRestaurant } from "@/services/cliente/cliente-service";
import DishesList from "@/ui/dish-list";


function RestaurantInfoSkeleton() {
  return (
    <View style={styles.infoCard}>
      <View style={styles.skeletonCover} />
      <View style={styles.infoSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.skeletonAvatar} />
        </View>
        <View style={styles.infoText}>
          <View style={[styles.skeletonLine, { width: "60%", height: 18 }]} />
          <View style={[styles.skeletonLine, { width: "90%", marginTop: 8 }]} />
          <View style={[styles.skeletonLine, { width: "50%", marginTop: 6 }]} />
        </View>
      </View>
    </View>
  );
}


export default function RestaurantDetailScreen({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      getCart(Number(id)).then(setCart).catch(() => setCart(null));
    }, [id]),
  );

  const cartItemCount = getCartItemCount(cart);

  return (
    <View style={styles.root}>
      {/* Cabecera fija */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </ScrollView>
      ) : loading ? (
        <RestaurantInfoSkeleton />
      ) : restaurant ? (
        <View style={[styles.body, cartItemCount > 0 && styles.bodyWithCart]}>
          {/* Ficha del local */}
          <View style={styles.infoCard}>
            <View style={styles.cover}>
              {restaurant.coverPhotoUrl ? (
                <Image
                  source={{ uri: restaurant.coverPhotoUrl }}
                  style={styles.coverImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.coverPlaceholder}>
                  {restaurant.name.charAt(0).toUpperCase()}
                </Text>
              )}
              <View style={[styles.stateBadge, restaurant.state ? styles.badgeOpen : styles.badgeClosed]}>
                {restaurant.state ? (
                  <CheckCircleIcon size={11} color="#065F46" />
                ) : (
                  <MoonIcon size={11} color="#6B7280" />
                )}
                <Text style={[styles.badgeText, restaurant.state ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                  {restaurant.state ? "Abierto" : "Cerrado"}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.avatarWrapper}>
                {restaurant.url_photo ? (
                  <Image
                    source={{ uri: restaurant.url_photo }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarPlaceholder}>
                    {restaurant.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={styles.infoText}>
                <View style={styles.nameRow}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <View style={styles.starsRow}>
                    <StarIcon size={14} color="#FB923C" />
                    <Text style={styles.starsText}>{restaurant.stars}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(tabs)/local/[id]/comentarios", params: { id } })}
                  >
                    <Text style={styles.ratingsLink}>Ver comentarios</Text>
                  </TouchableOpacity>
                </View>

                {restaurant.description ? (
                  <Text style={styles.description}>{restaurant.description}</Text>
                ) : null}

                {restaurant.address ? (
                  <View style={styles.addressRow}>
                    <MapPinIcon size={13} color={Brand.gray400} />
                    <Text style={styles.addressText}>{restaurant.address}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Platos */}
          <Text style={styles.dishesTitle}>Platos disponibles</Text>
          <DishesList idLocal={Number(id)} cart={cart} onCartUpdate={setCart} />
        </View>
      ) : null}

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
                router.push({ pathname: "/(tabs)/local/[id]/cart", params: { id } })
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

  body: { flex: 1 },
  bodyWithCart: { paddingBottom: 88 },

  infoCard: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: Brand.gray200 },

  cover: { height: 150, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coverImg: { width: "100%", height: "100%", position: "absolute" },
  coverPlaceholder: { fontSize: 48, fontWeight: "900", color: "rgba(234,72,0,0.4)" },

  infoSection: { flexDirection: "row", padding: 16, gap: 14 },

  avatarWrapper: { marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#fff" },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#fff", backgroundColor: "#FFF7ED", textAlign: "center", lineHeight: 72, fontSize: 32, fontWeight: "900", color: Brand.primary },

  stateBadge: { position: "absolute", bottom: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOpen: { backgroundColor: "#D1FAE5" },
  badgeClosed: { backgroundColor: "#F3F4F6" },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextOpen: { color: "#065F46" },
  badgeTextClosed: { color: "#6B7280" },

  infoText: { flex: 1, justifyContent: "center", gap: 4, marginTop: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  restaurantName: { fontSize: 16, fontWeight: "800", color: Brand.black, flexShrink: 1 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  starsText: { fontSize: 13, color: "#FB923C", fontWeight: "600" },
  ratingsLink: { fontSize: 12, color: Brand.gray600 },
  description: { fontSize: 13, color: Brand.gray600, lineHeight: 18 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  addressText: { fontSize: 12, color: Brand.gray400, flexShrink: 1 },

  dishesTitle: { fontSize: 15, fontWeight: "700", color: Brand.gray800, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Brand.gray100 },

  errorBanner: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 16 },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },

  skeletonCover: { height: 150, backgroundColor: Brand.gray200 },
  skeletonAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#fff", backgroundColor: Brand.gray200 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },

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
