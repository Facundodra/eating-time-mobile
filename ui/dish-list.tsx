import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { MinusIcon, PlusIcon, TagIcon } from "react-native-heroicons/outline";

import { Brand } from "@/constants/theme";
import { getActiveCartItems } from "@/lib/cliente/cart-utils";
import type { Cart, ClientDish, Discount } from "@/lib/cliente/types";
import { getDishDiscount, getDishes, getDiscountedDishIds, updateCartItem, type DishFilter } from "@/services/cliente/cliente-service";

const PAGE_SIZE = 20;

type OrdenValue = "" | "precio-asc" | "precio-desc" | "nombre-asc" | "nombre-desc" | "popularidad-desc" | "popularidad-asc";
type Filters = Omit<DishFilter, "pagina" | "tamano">;

const ordenLabels: Record<OrdenValue, string> = {
  "": "Por defecto",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  "nombre-asc": "Nombre: A-Z",
  "nombre-desc": "Nombre: Z-A",
  "popularidad-desc": "Más populares",
  "popularidad-asc": "Menos populares",
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

type Props = {
  idLocal?: number;
  cart?: Cart | null;
  onCartUpdate?: (cart: Cart | null) => void;
};

export default function DishesList({ idLocal, cart, onCartUpdate }: Props) {
  const [dishes, setDishes] = useState<ClientDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [updatingDishId, setUpdatingDishId] = useState<number | null>(null);
  const cartUpdateInFlight = useRef(false);

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  const [discountedIds, setDiscountedIds] = useState<Set<number> | null>(null);
  const [discounts, setDiscounts] = useState<Map<number, Discount | null>>(new Map());
  const requestedDiscountIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    setDiscountedIds(null);
    setDiscounts(new Map());
    requestedDiscountIds.current = new Set();
    let cancelled = false;
    getDiscountedDishIds(idLocal)
      .then((ids) => { if (!cancelled) setDiscountedIds(ids); })
      .catch(() => { if (!cancelled) setDiscountedIds(new Set()); });
    return () => { cancelled = true; };
  }, [idLocal]);

  useEffect(() => {
    if (!discountedIds) return;
    const idsToFetch = dishes
      .map((dish) => Number(dish.id))
      .filter((id) => discountedIds.has(id) && !requestedDiscountIds.current.has(id));
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id) => requestedDiscountIds.current.add(id));
    Promise.allSettled(idsToFetch.map(getDishDiscount)).then((results) => {
      setDiscounts((prev) => {
        const next = new Map(prev);
        results.forEach((result, i) => {
          next.set(idsToFetch[i], result.status === "fulfilled" ? result.value : null);
        });
        return next;
      });
    });
  }, [dishes, discountedIds]);

  useEffect(() => {
    const isNewSearch = page === 1;
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    getDishes({ ...filters, idLocal, pagina: page - 1, tamano: PAGE_SIZE })
      .then((data) => {
        setDishes((prev) => (isNewSearch ? data.dishes : [...prev, ...data.dishes]));
        setHasMore(data.page + 1 < data.totalPages);
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
      const [orden, sentido] = val.split("-") as [NonNullable<DishFilter["orden"]>, "asc" | "desc"];
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

  const ordenValue = (filters.orden
    ? `${filters.orden}-${filters.sentido ?? "asc"}`
    : "") as OrdenValue;

  function getCartQty(dishId: string): number {
    if (!cart) return 0;
    const item = getActiveCartItems(cart).find((i) => i.platoId === Number(dishId));
    return item?.cantidad ?? 0;
  }

  async function handleCartUpdate(dishId: string, delta: number) {
    if (!idLocal || !onCartUpdate) return;
    if (cartUpdateInFlight.current) return;
    cartUpdateInFlight.current = true;
    setUpdatingDishId(Number(dishId));
    try {
      const updated = await updateCartItem(idLocal, Number(dishId), delta);
      const hasActiveItems = getActiveCartItems(updated).length > 0;
      onCartUpdate(hasActiveItems ? updated : null);
    } catch (err) {
      console.warn('[carrito] error en updateCartItem:', err);
    } finally {
      cartUpdateInFlight.current = false;
      setUpdatingDishId(null);
    }
  }

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
          renderItem={({ item }) => {
            const qty = getCartQty(item.id);
            const isUpdating = updatingDishId === Number(item.id);
            const showCart = idLocal != null && onCartUpdate != null;
            const discount = discounts.get(Number(item.id));
            const discountedPrice = discount
              ? Math.round(item.price * (1 - discount.porcentaje / 100) * 100) / 100
              : null;

            return (
              <View style={styles.col}>
                <View style={styles.card}>
                  <TouchableOpacity
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
                      {discount && (
                        <View style={styles.discountBadge}>
                          <TagIcon size={11} color="#fff" />
                          <Text style={styles.discountBadgeText}>-{discount.porcentaje}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.nombre} numberOfLines={2}>{item.name}</Text>
                      {item.localName ? (
                        <Text style={styles.localName} numberOfLines={1}>{item.localName}</Text>
                      ) : null}
                      {discountedPrice != null ? (
                        <View style={styles.priceRow}>
                          <Text style={styles.precio}>${discountedPrice}</Text>
                          <Text style={styles.originalPrice}>${item.price}</Text>
                        </View>
                      ) : (
                        <Text style={styles.precio}>${item.price}</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {showCart && (
                    <View style={styles.cartControls}>
                      {qty === 0 ? (
                        <TouchableOpacity
                          disabled={isUpdating}
                          style={[styles.addBtn, isUpdating && styles.addBtnDisabled]}
                          onPress={() => handleCartUpdate(item.id, 1)}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <PlusIcon size={16} color="#fff" />
                              <Text style={styles.addBtnText}>Agregar</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            disabled={isUpdating}
                            onPress={() => handleCartUpdate(item.id, -1)}
                            style={styles.qtyBtn}
                          >
                            <MinusIcon size={14} color={Brand.primary} />
                          </TouchableOpacity>
                          {isUpdating ? (
                            <ActivityIndicator size="small" color={Brand.primary} />
                          ) : (
                            <Text style={styles.qtyText}>{qty}</Text>
                          )}
                          <TouchableOpacity
                            disabled={isUpdating}
                            onPress={() => handleCartUpdate(item.id, 1)}
                            style={styles.qtyBtn}
                          >
                            <PlusIcon size={14} color={Brand.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          onEndReached={() => {
            if (hasMore && !loadingMore) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreWrapper}>
                <ActivityIndicator size="small" color={Brand.primary} />
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

  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, height: 30 },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillText: { fontSize: 12, fontWeight: "500", color: Brand.gray600 },
  pillTextActive: { color: "#fff" },

  priceInput: { width: 64, borderWidth: 1, borderColor: Brand.gray200, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, color: Brand.black, backgroundColor: "#fff" },
  priceSep: { fontSize: 12, color: Brand.gray400 },

  scrollContent: { padding: 8, paddingBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  col: { width: "50%", padding: 5 },

  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Brand.gray200, overflow: "hidden" },

  imgWrapper: { backgroundColor: "#FFF7ED", height: 130, justifyContent: "center", alignItems: "center", position: "relative" },
  img: { width: "100%", height: "100%" },
  imgPlaceholderText: { fontSize: 40, fontWeight: "900", color: Brand.primary },

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

  info: { padding: 10, gap: 4 },
  nombre: { fontSize: 13, fontWeight: "700", color: Brand.black },
  localName: { fontSize: 11, color: Brand.gray400 },
  precio: { fontSize: 14, fontWeight: "700", color: Brand.primary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  originalPrice: { fontSize: 12, color: Brand.gray400, textDecorationLine: "line-through" },

  cartControls: { paddingHorizontal: 10, paddingBottom: 10 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Brand.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyBtn: { padding: 4 },
  qtyText: { fontSize: 14, fontWeight: "700", color: Brand.primary, minWidth: 20, textAlign: "center" },

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
