import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeftIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import RatingsList from "@/ui/ratings-list";

export default function ComentariosPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver al restaurante</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Comentarios</Text>

      <RatingsList restaurantId={Number(id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 14, color: Brand.gray600 },

  title: { fontSize: 18, fontWeight: "800", color: Brand.black, paddingHorizontal: 16, paddingTop: 16 },
});
