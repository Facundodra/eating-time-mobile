import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircleIcon, MoonIcon, StarIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import type { ClientDish, RestaurantList } from "@/lib/cliente/types";
import { getDishes, getRestaurants } from "@/services/cliente/cliente-service";


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

function DishCard({ item }: { item: ClientDish }) {
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
      </View>
      <View style={styles.dishInfo}>
        <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.dishPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );
}


// ─── Home ─────────────────────────────────────────────────────────────────────

export default function ClientHomePage() {
  const [restaurants, setRestaurants] = useState<RestaurantList[]>([]);
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(true);

  useEffect(() => {
    getRestaurants({ ordenarPor: "calificacion", direccion: "desc", size: 8 })
      .then(({ restaurants }) => setRestaurants(restaurants))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    getDishes({ tamano: 8 })
      .then(setDishes)
      .finally(() => setLoadingDishes(false));
  }, []);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
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
        ) : (
          <FlatList
            horizontal
            data={dishes}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <DishCard item={item} />}
          />
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

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
  dishImgWrapper: { height: 110, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center" },
  dishImg: { width: "100%", height: "100%" },
  dishImgPlaceholder: { fontSize: 38, fontWeight: "900", color: Brand.primary },
  dishInfo: { padding: 10, gap: 3 },
  dishName: { fontSize: 12, fontWeight: "700", color: Brand.black },
  dishPrice: { fontSize: 13, fontWeight: "700", color: Brand.primary },

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
