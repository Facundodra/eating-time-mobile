import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { StarIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import type { LocalRating } from "@/lib/cliente/types";
import { getLocalRatings } from "@/services/cliente/cliente-service";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function RatingCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.skeletonLine, { width: "40%" }]} />
        <View style={[styles.skeletonLine, { width: 32 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: "70%", marginTop: 10 }]} />
      <View style={styles.divider} />
      <View style={[styles.skeletonLine, { width: "30%", height: 10 }]} />
    </View>
  );
}

export default function RatingsList({ restaurantId }: { restaurantId: number }) {
  const [ratings, setRatings] = useState<LocalRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLocalRatings(restaurantId)
      .then((data) => {
        if (!cancelled) setRatings(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (loading) {
    return (
      <View style={styles.root}>
        {Array.from({ length: 4 }).map((_, i) => (
          <RatingCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (ratings.length === 0) {
    return (
      <View style={styles.root}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Este local todavía no tiene comentarios.</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={ratings}
      keyExtractor={(item) => String(item.id)}
      style={styles.flatList}
      contentContainerStyle={styles.root}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.clientName}>{item.nombreCliente}</Text>
            <View style={styles.starsRow}>
              <StarIcon size={14} color="#FB923C" />
              <Text style={styles.starsText}>{item.calificacion}</Text>
            </View>
          </View>
          {item.comentario ? <Text style={styles.comment}>{item.comentario}</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.date}>{formatDate(item.creacion)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 12 },
  flatList: { flex: 1 },

  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  clientName: { fontSize: 14, fontWeight: "800", color: Brand.black, flexShrink: 1 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  starsText: { fontSize: 13, color: "#FB923C", fontWeight: "700" },
  comment: { marginTop: 8, fontSize: 13, color: Brand.gray600, lineHeight: 18 },

  divider: { height: 1, backgroundColor: Brand.gray100, marginTop: 12, marginBottom: 8 },
  date: { fontSize: 11, color: Brand.gray400 },

  errorBanner: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 16 },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },

  emptyCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 13, color: Brand.gray400, textAlign: "center" },

  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200 },
});
