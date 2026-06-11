import { router } from "expo-router";
import { useEffect, useState } from "react";
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
  StarIcon,
} from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import type { Restaurant } from "@/lib/cliente/types";
import { getRestaurant } from "@/services/cliente/cliente-service";
import DishesList from "@/ui/dish-list";


function RestaurantInfoSkeleton() {
  return (
    <View style={styles.infoCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.infoText}>
        <View style={[styles.skeletonLine, { width: "60%", height: 18 }]} />
        <View style={[styles.skeletonLine, { width: "90%", marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "50%", marginTop: 6 }]} />
      </View>
    </View>
  );
}


export default function RestaurantDetailScreen({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRestaurant(id)
      .then(setRestaurant)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

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
        <View style={styles.body}>
          {/* Ficha del local */}
          <View style={styles.infoCard}>
            <View style={styles.avatarWrapper}>
              {restaurant.url_photo ? (
                <Image
                  source={{ uri: restaurant.url_photo }}
                  style={styles.avatar}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.avatarPlaceholder}>
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

          {/* Platos */}
          <Text style={styles.dishesTitle}>Platos disponibles</Text>
          <DishesList idLocal={Number(id)} />
        </View>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 14, color: Brand.gray600 },

  body: { flex: 1 },

  infoCard: { flexDirection: "row", backgroundColor: "#fff", padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },

  avatarWrapper: { alignItems: "center", gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFF7ED", textAlign: "center", lineHeight: 80, fontSize: 32, fontWeight: "900", color: Brand.primary },

  stateBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOpen: { backgroundColor: "#D1FAE5" },
  badgeClosed: { backgroundColor: "#F3F4F6" },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextOpen: { color: "#065F46" },
  badgeTextClosed: { color: "#6B7280" },

  infoText: { flex: 1, justifyContent: "center", gap: 4 },
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

  skeletonAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Brand.gray200 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },
});
