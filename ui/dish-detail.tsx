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
  ChevronLeftIcon,
  ShoppingCartIcon,
} from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import type { ClientDish } from "@/lib/cliente/types";
import { getDish, getRestaurantName } from "@/services/cliente/cliente-service";


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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDish(id)
      .then((d) => {
        setDish(d);
        return getRestaurantName(d.localId);
      })
      .then(setLocalName)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <View style={styles.root}>
      {/* Cabecera fija */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

          <Text style={styles.price}>${dish.price}</Text>

          {localName ? (
            <Text style={styles.localName}>{localName}</Text>
          ) : null}

          {/* Botón agregar al carrito */}
          <TouchableOpacity
            disabled={!available}
            style={[styles.cartBtn, !available && styles.cartBtnDisabled]}
            activeOpacity={0.85}
          >
            <ShoppingCartIcon size={20} color="#fff" />
            <Text style={styles.cartBtnText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 14, color: Brand.gray600 },

  imgWrapper: { height: 240, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center" },
  img: { width: "100%", height: "100%" },
  imgPlaceholder: { fontSize: 80, fontWeight: "900", color: Brand.primary },

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
  localName: { fontSize: 13, color: Brand.gray400, marginTop: 2 },

  cartBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
  cartBtnDisabled: { opacity: 0.5 },
  cartBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  errorBanner: { margin: 16, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 16 },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },

  skeletonImg: { height: 240, backgroundColor: Brand.gray200 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },
});
