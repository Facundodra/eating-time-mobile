import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircleIcon, MoonIcon, StarIcon, TagIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import type { ClientDish, Discount, RestaurantList } from "@/lib/cliente/types";
import { getDishDiscount, getDishes, getDiscountedDishIds, getRestaurants } from "@/services/cliente/cliente-service";


// ─── Skeletons ────────────────────────────────────────────────────────────────

function RestaurantCardSkeleton() {
  return (
    <View style={[styles.restaurantCard, styles.skeleton]}>
      <View style={styles.restaurantSkeletonImg} />
      <View style={{ padding: 10, gap: 8 }}>
        <View style={[styles.skeletonLine, { width: "80%" }]} />
        <View style={[styles.skeletonLine, { width: "40%" }]} />
      </View>
    </View>
  );
}

function DishCardSkeleton() {
  return (
    <View style={[styles.dishCard, styles.skeleton]}>
      <View style={styles.dishSkeletonImg} />
      <View style={{ padding: 10, gap: 8 }}>
        <View style={[styles.skeletonLine, { width: "75%" }]} />
        <View style={[styles.skeletonLine, { width: "35%" }]} />
      </View>
    </View>
  );
}


// ─── Cards ────────────────────────────────────────────────────────────────────

function RestaurantCard({ item }: { item: RestaurantList }) {
  return (
    <TouchableOpacity
      style={styles.restaurantCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/(tabs)/local/${item.id}`)}
    >
      <View style={styles.restaurantImgWrapper}>
        {item.url_photo ? (
          <Image
            source={{ uri: item.url_photo }}
            style={styles.restaurantImg}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.restaurantImgPlaceholder}>🍽</Text>
        )}
        <View style={[styles.badge, item.state ? styles.badgeOpen : styles.badgeClosed]}>
          {item.state ? (
            <CheckCircleIcon size={11} color="#065F46" />
          ) : (
            <MoonIcon size={11} color="#6B7280" />
          )}
          <Text style={[styles.badgeText, item.state ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {item.state ? "Abierto" : "Cerrado"}
          </Text>
        </View>
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <StarIcon size={12} color="#FB923C" />
          <Text style={styles.ratingText}>{item.stars}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DishCard({ item, discount }: { item: ClientDish; discount?: Discount | null }) {
  const discountedPrice = discount
    ? Math.round(item.price * (1 - discount.porcentaje / 100) * 100) / 100
    : null;

  return (
    <TouchableOpacity
      style={styles.dishCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/(tabs)/plato/[id]", params: { id: item.id } })}
    >
      <View style={styles.dishImgWrapper}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.dishImg}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.dishImgPlaceholder}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <TagIcon size={11} color="#fff" />
            <Text style={styles.discountBadgeText}>-{discount.porcentaje}%</Text>
          </View>
        )}
      </View>
      <View style={styles.dishInfo}>
        <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
        {discountedPrice != null ? (
          <View style={styles.priceRow}>
            <Text style={styles.dishPrice}>${discountedPrice}</Text>
            <Text style={styles.originalPrice}>${item.price}</Text>
          </View>
        ) : (
          <Text style={styles.dishPrice}>${item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}


// ─── Home ─────────────────────────────────────────────────────────────────────

function GuestPrompt() {
  return (
    <View style={styles.guestBox}>
      <Text style={styles.guestTitle}>Iniciá sesión para explorar</Text>
      <Text style={styles.guestText}>
        Los locales y platos solo se muestran cuando tenés una cuenta de cliente activa.
      </Text>
      <TouchableOpacity
        style={styles.guestButton}
        onPress={() => router.push("/auth/login")}
        activeOpacity={0.85}
      >
        <Text style={styles.guestButtonText}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ClientHomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<Map<number, Discount | null>>(new Map());

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoadingRestaurants(true);
    setLoadingDishes(true);
    setError(null);

    try {
      const [restaurantsResult, dishesResult] = await Promise.all([
        getRestaurants({ ordenarPor: "calificacion", direccion: "desc", size: 8 }),
        getDishes({ tamano: 8 }),
      ]);
      setRestaurants(restaurantsResult.restaurants);
      setDishes(dishesResult);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar el contenido.";
      setError(message);
      setRestaurants([]);
      setDishes([]);
    } finally {
      setLoadingRestaurants(false);
      setLoadingDishes(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRestaurants([]);
      setDishes([]);
      setError(null);
      setLoadingRestaurants(false);
      setLoadingDishes(false);
      return;
    }

    loadData();
  }, [authLoading, user, loadData]);

  useEffect(() => {
    if (dishes.length === 0) {
      setDiscounts(new Map());
      return;
    }

    let cancelled = false;
    getDiscountedDishIds()
      .then((discountedIds) => {
        const idsToFetch = dishes
          .map((dish) => Number(dish.id))
          .filter((id) => discountedIds.has(id));
        if (idsToFetch.length === 0) return;
        return Promise.allSettled(idsToFetch.map(getDishDiscount)).then((results) => {
          if (cancelled) return;
          setDiscounts((prev) => {
            const next = new Map(prev);
            results.forEach((result, i) => {
              next.set(idsToFetch[i], result.status === "fulfilled" ? result.value : null);
            });
            return next;
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [dishes]);

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.guestContent}>
        <GuestPrompt />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {error ? <ErrorBanner message={error} onRetry={loadData} /> : null}

      {/* Mejores locales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mejores locales</Text>
        {loadingRestaurants ? (
          <FlatList
            horizontal
            data={Array.from({ length: 5 })}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={() => <RestaurantCardSkeleton />}
          />
        ) : restaurants.length === 0 ? (
          <Text style={styles.emptyText}>No hay locales para mostrar.</Text>
        ) : (
          <FlatList
            horizontal
            data={restaurants}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <RestaurantCard item={item} />}
          />
        )}
      </View>

      {/* Platos destacados */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={styles.sectionTitle}>Platos destacados</Text>
        {loadingDishes ? (
          <FlatList
            horizontal
            data={Array.from({ length: 5 })}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={() => <DishCardSkeleton />}
          />
        ) : dishes.length === 0 ? (
          <Text style={styles.emptyText}>No hay platos para mostrar.</Text>
        ) : (
          <FlatList
            horizontal
            data={dishes}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <DishCard item={item} discount={discounts.get(Number(item.id))} />}
          />
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Brand.gray100 },
  guestContent: { flexGrow: 1, justifyContent: "center", padding: 24 },

  guestBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  guestTitle: { fontSize: 18, fontWeight: "800", color: Brand.black, textAlign: "center" },
  guestText: { fontSize: 14, color: Brand.gray600, textAlign: "center", lineHeight: 20 },
  guestButton: {
    marginTop: 8,
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  guestButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  errorBanner: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 16,
    gap: 10,
  },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },
  retryButton: { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 12 },
  retryButtonText: { color: Brand.primary, fontSize: 13, fontWeight: "600" },

  emptyText: { fontSize: 13, color: Brand.gray400, paddingVertical: 8 },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Brand.black, marginBottom: 12 },
  listContent: { gap: 12, paddingRight: 16 },

  // Restaurant card
  restaurantCard: { width: 160, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: "hidden" },
  restaurantImgWrapper: { height: 100, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center", padding: 10 },
  restaurantImg: { width: "100%", height: "100%" },
  restaurantImgPlaceholder: { fontSize: 32 },
  restaurantInfo: { padding: 10, gap: 4 },
  restaurantName: { fontSize: 12, fontWeight: "700", color: Brand.black },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 11, color: Brand.gray400 },

  // Dish card
  dishCard: { width: 140, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: "hidden" },
  dishImgWrapper: { height: 110, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center", position: "relative" },
  dishImg: { width: "100%", height: "100%" },
  dishImgPlaceholder: { fontSize: 38, fontWeight: "900", color: Brand.primary },
  dishInfo: { padding: 10, gap: 3 },
  dishName: { fontSize: 12, fontWeight: "700", color: Brand.black },
  dishPrice: { fontSize: 13, fontWeight: "700", color: Brand.primary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  originalPrice: { fontSize: 11, color: Brand.gray400, textDecorationLine: "line-through" },

  discountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Brand.primary,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  // Badge
  badge: { position: "absolute", top: 7, right: 7, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  badgeOpen: { backgroundColor: "#D1FAE5" },
  badgeClosed: { backgroundColor: "#F3F4F6" },
  badgeText: { fontSize: 9, fontWeight: "600" },
  badgeTextOpen: { color: "#065F46" },
  badgeTextClosed: { color: "#6B7280" },

  // Skeleton
  skeleton: { borderColor: Brand.gray200 },
  restaurantSkeletonImg: { height: 100, backgroundColor: Brand.gray200 },
  dishSkeletonImg: { height: 110, backgroundColor: Brand.gray200 },
  skeletonLine: { height: 11, borderRadius: 6, backgroundColor: Brand.gray200 },
});
