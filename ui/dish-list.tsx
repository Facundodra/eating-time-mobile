import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TagIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import { getDishes, type DishFilter } from "@/services/cliente/cliente-service";
import type { ClientDish } from "@/lib/cliente/types";

const PAGE_SIZE = 20;

type OrdenValue = "" | "precio-asc" | "precio-desc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

const ordenLabels: Record<OrdenValue, string> = {
  "": "Por defecto",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
};

function DishSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.col}>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonImg} />
            <View style={styles.skeletonBody}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: "40%" }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function DishesList({ idLocal }: { idLocal?: number }) {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  useEffect(() => {
    const isNewSearch = page === 1;
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    getDishes({ ...filters, idLocal, pagina: page, tamano: PAGE_SIZE })
      .then((data) => {
        setDishes((prev) => (isNewSearch ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => {
        if (isNewSearch) setLoading(false);
        else setLoadingMore(false);
      });
  }, [filters, page, idLocal]);

  function updateFilters(patch: Partial<Filters>) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleOrden(val: OrdenValue) {
    if (val === "") {
      updateFilters({ orden: undefined, sentido: undefined });
    } else {
      const [orden, sentido] = val.split("-") as ["precio", "asc" | "desc"];
      updateFilters({ orden, sentido });
    }
  }

  function toggleDescuento() {
    updateFilters({ conDescuento: filters.conDescuento ? undefined : true });
  }

  function applyPrecio() {
    const min = Number(precioMin);
    const max = Number(precioMax);
    updateFilters({
      precioMin: precioMin !== "" && !isNaN(min) ? min : undefined,
      precioMax: precioMax !== "" && !isNaN(max) ? max : undefined,
    });
  }

  const ordenValue: OrdenValue = filters.orden
    ? `${filters.orden}-${filters.sentido ?? "asc"}`
    : "";

  return (
    <View style={styles.root}>
      {/* Barra de filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <Text style={styles.filterLabel}>Ordenar:</Text>
        {(Object.keys(ordenLabels) as OrdenValue[]).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => handleOrden(key)}
            style={[styles.pill, ordenValue === key && styles.pillActive]}
          >
            <Text style={[styles.pillText, ordenValue === key && styles.pillTextActive]}>
              {ordenLabels[key]}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.filterSep} />

        <Text style={styles.filterLabel}>Filtrar:</Text>
        <TouchableOpacity
          onPress={toggleDescuento}
          style={[styles.pill, filters.conDescuento && styles.pillActive]}
        >
          <TagIcon size={14} color={filters.conDescuento ? "#fff" : Brand.gray600} />
          <Text style={[styles.pillText, filters.conDescuento && styles.pillTextActive]}>
            Con descuento
          </Text>
        </TouchableOpacity>

        <View style={styles.filterSep} />

        <Text style={styles.filterLabel}>Precio:</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="mín"
          placeholderTextColor={Brand.gray400}
          keyboardType="numeric"
          value={precioMin}
          onChangeText={setPrecioMin}
          onBlur={applyPrecio}
          onSubmitEditing={applyPrecio}
        />
        <Text style={styles.priceSep}>—</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="máx"
          placeholderTextColor={Brand.gray400}
          keyboardType="numeric"
          value={precioMax}
          onChangeText={setPrecioMax}
          onBlur={applyPrecio}
          onSubmitEditing={applyPrecio}
        />
      </ScrollView>

      {/* Resultados */}
      {loading ? (
        <DishSkeleton />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : dishes.length === 0 ? (
        <Text style={styles.emptyText}>
          No se encontraron resultados para los filtros aplicados.
        </Text>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item }) => (
            <View style={styles.col}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(tabs)/plato/[id]", params: { id: item.id } })}
              >
                <View style={styles.imgWrapper}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.img}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.imgPlaceholderText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.nombre} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.precio}>${item.price}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.loadMoreWrapper}>
                <TouchableOpacity
                  onPress={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={Brand.gray600} />
                  ) : (
                    <Text style={styles.loadMoreText}>Cargar más</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  filterBar: { backgroundColor: "#fff", flexGrow: 0 },
  filterBarContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: "600", color: Brand.gray800 },
  filterSep: { width: 1, height: 20, backgroundColor: Brand.gray200, marginHorizontal: 4 },

  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: "500", color: Brand.gray600 },
  pillTextActive: { color: "#fff" },

  priceInput: { width: 64, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, color: Brand.black, backgroundColor: "#fff" },
  priceSep: { fontSize: 12, color: Brand.gray400 },

  scrollContent: { padding: 8, paddingBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  col: { width: "50%", padding: 5 },

  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: "hidden" },

  imgWrapper: { backgroundColor: "#FFF7ED", height: 130, justifyContent: "center", alignItems: "center" },
  img: { width: "100%", height: "100%" },
  imgPlaceholderText: { fontSize: 40, fontWeight: "900", color: Brand.primary },

  info: { padding: 10, gap: 4 },
  nombre: { fontSize: 13, fontWeight: "700", color: Brand.black },
  precio: { fontSize: 14, fontWeight: "700", color: Brand.primary },

  skeletonCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: "hidden" },
  skeletonImg: { height: 130, backgroundColor: Brand.gray200 },
  skeletonBody: { padding: 10, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Brand.gray200, width: "80%" },

  errorText: { margin: 16, color: "#DC2626", fontSize: 13, textAlign: "center" },
  emptyText: { textAlign: "center", marginTop: 40, color: Brand.gray400, fontSize: 14 },

  loadMoreWrapper: { alignItems: "center", marginTop: 16, marginBottom: 8 },
  loadMoreBtn: { borderWidth: 1, borderColor: Brand.gray200, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  loadMoreBtnDisabled: { opacity: 0.6 },
  loadMoreText: { fontSize: 13, fontWeight: "600", color: Brand.gray600 },
});
