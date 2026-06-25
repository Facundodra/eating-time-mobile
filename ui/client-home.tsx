import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  StarIcon,
  TagIcon,
  XMarkIcon,
} from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { ClientDish, Discount, DishCategory, RestaurantList } from '@/lib/cliente/types';
import {
  getDishCategories,
  getDishDiscount,
  getDiscountedDishIds,
  getDishes,
  getOrderAgainDishes,
  getRestaurants,
} from '@/services/cliente/cliente-service';

type SearchTab = 'platos' | 'restaurantes';

const PREVIEW_SIZE = 4;
const PAGE_SIZE = 12;

type ListItem =
  | { kind: 'dish'; data: ClientDish }
  | { kind: 'restaurant'; data: RestaurantList };

// ─── Shared row components ────────────────────────────────────────────────────

function RestaurantRow({ item }: { item: RestaurantList }) {
  return (
    <TouchableOpacity
      style={styles.rowCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/(tabs)/local/${item.id}`)}
    >
      <View style={styles.restImgWrap}>
        {item.url_photo ? (
          <Image source={{ uri: item.url_photo }} style={styles.restImg} resizeMode="cover" />
        ) : (
          <Text style={styles.restImgPlaceholder}>🍽</Text>
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <StarIcon size={13} color="#FB923C" />
          <Text style={styles.ratingText}>{item.stars}</Text>
        </View>
        <View style={[styles.badge, item.state ? styles.badgeOpen : styles.badgeClosed]}>
          {item.state ? (
            <CheckCircleIcon size={11} color="#065F46" />
          ) : (
            <MoonIcon size={11} color="#6B7280" />
          )}
          <Text style={[styles.badgeText, item.state ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {item.state ? 'Abierto' : 'Cerrado'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DishRow({ item, discount }: { item: ClientDish; discount?: Discount | null }) {
  const discountedPrice = discount
    ? Math.round(item.price * (1 - discount.porcentaje / 100) * 100) / 100
    : null;

  return (
    <TouchableOpacity
      style={styles.rowCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/(tabs)/plato/[id]', params: { id: item.id } })}
    >
      <View style={styles.dishImgWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.dishImg} resizeMode="cover" />
        ) : (
          <Text style={styles.dishImgPlaceholder}>{item.name.charAt(0).toUpperCase()}</Text>
        )}
        {discount ? (
          <View style={styles.discountBadge}>
            <TagIcon size={11} color="#fff" />
            <Text style={styles.discountBadgeText}>-{discount.porcentaje}%</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.name}</Text>
        {item.localName ? (
          <Text style={styles.localName} numberOfLines={1}>{item.localName}</Text>
        ) : null}
        {discountedPrice != null ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>${discountedPrice}</Text>
            <Text style={styles.originalPrice}>${item.price}</Text>
          </View>
        ) : (
          <Text style={styles.price}>${item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function GuestPrompt() {
  return (
    <View style={styles.guestBox}>
      <Text style={styles.guestTitle}>Explorá EatingTime</Text>
      <Text style={styles.guestText}>Iniciá sesión para ver locales, platos y hacer pedidos.</Text>
      <TouchableOpacity
        style={styles.guestButton}
        onPress={() => router.push('/auth/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.guestButtonText}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientHomePage() {
  const { user, isLoading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('platos');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);

  const showResults = Boolean(searchQuery) || selectedCategories.length > 0;
  const isDishResults = !showResults || searchTab === 'platos' || selectedCategories.length > 0;
  const categoryKey = selectedCategories.join('\0');

  const [orderAgain, setOrderAgain] = useState<ClientDish[]>([]);
  const [promoDishes, setPromoDishes] = useState<ClientDish[]>([]);
  const [popularDishes, setPopularDishes] = useState<ClientDish[]>([]);
  const [topRestaurants, setTopRestaurants] = useState<RestaurantList[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [homeLoaded, setHomeLoaded] = useState(false);

  const [dishResults, setDishResults] = useState<ClientDish[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<RestaurantList[]>([]);
  const [browsePage, setBrowsePage] = useState(0);
  const [browseHasMore, setBrowseHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<Map<number, Discount | null>>(new Map());
  const discountedIdsRef = useRef<Set<number>>(new Set());
  const requestedDiscountIds = useRef<Set<number>>(new Set());
  const endReachedGuard = useRef(false);
  const browseRequestId = useRef(0);

  const fetchDiscountsForDishes = useCallback((dishes: ClientDish[], ids: Set<number>) => {
    const idsToFetch = dishes
      .map((d) => Number(d.id))
      .filter((id) => ids.has(id) && !requestedDiscountIds.current.has(id));
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id) => requestedDiscountIds.current.add(id));
    Promise.allSettled(idsToFetch.map(getDishDiscount)).then((results) => {
      setDiscounts((prev) => {
        const next = new Map(prev);
        results.forEach((result, i) => {
          next.set(idsToFetch[i], result.status === 'fulfilled' ? result.value : null);
        });
        return next;
      });
    });
  }, []);

  useEffect(() => {
    getDishCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setHomeLoaded(false);
      return;
    }
    if (homeLoaded) return;

    let cancelled = false;
    setHomeLoading(true);
    setHomeError(null);

    (async () => {
      try {
        const [again, promos, popular, restaurants, discounted] = await Promise.all([
          getOrderAgainDishes(8).catch(() => [] as ClientDish[]),
          getDishes({ conDescuento: true, tamano: PREVIEW_SIZE, pagina: 0 }).catch(() => ({
            dishes: [] as ClientDish[],
            totalPages: 0,
            totalElements: 0,
            page: 0,
          })),
          getDishes({ orden: 'popularidad', sentido: 'desc', tamano: 8, pagina: 0 }).catch(() => ({
            dishes: [] as ClientDish[],
            totalPages: 0,
            totalElements: 0,
            page: 0,
          })),
          getRestaurants({ ordenarPor: 'calificacion', direccion: 'desc', size: PREVIEW_SIZE, page: 0 }).catch(() => ({
            restaurants: [] as RestaurantList[],
            totalPages: 0,
          })),
          getDiscountedDishIds().catch(() => new Set<number>()),
        ]);
        if (cancelled) return;
        setOrderAgain(again);
        setPromoDishes(promos.dishes);
        setPopularDishes(popular.dishes);
        setTopRestaurants(restaurants.restaurants);
        discountedIdsRef.current = discounted;
        fetchDiscountsForDishes([...again, ...promos.dishes, ...popular.dishes], discounted);
        setHomeLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setHomeError(err instanceof Error ? err.message : 'Error al cargar el inicio');
        }
      } finally {
        if (!cancelled) setHomeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, homeLoaded, fetchDiscountsForDishes]);

  useEffect(() => {
    if (!showResults || !user?.id) {
      setBrowseLoading(false);
      setBrowseLoadingMore(false);
      setBrowseError(null);
      setDishResults([]);
      setRestaurantResults([]);
      setBrowsePage(0);
      setBrowseHasMore(false);
      return;
    }

    const requestId = ++browseRequestId.current;
    let cancelled = false;

    (async () => {
      setBrowseLoading(true);
      setBrowseError(null);
      setDishResults([]);
      setRestaurantResults([]);
      setBrowsePage(0);

      try {
        if (searchQuery && searchTab === 'restaurantes' && selectedCategories.length === 0) {
          const { restaurants, totalPages } = await getRestaurants({
            nombre: searchQuery,
            ordenarPor: 'calificacion',
            direccion: 'desc',
            page: 0,
            size: PAGE_SIZE,
          });
          if (cancelled || requestId !== browseRequestId.current) return;
          setRestaurantResults(restaurants);
          setBrowseHasMore(totalPages > 1);
        } else {
          const { dishes, totalPages, page: currentPage } = await getDishes({
            nombre: searchQuery || undefined,
            categorias: selectedCategories.length > 0 ? selectedCategories : undefined,
            pagina: 0,
            tamano: PAGE_SIZE,
            orden: selectedCategories.length > 0 ? 'nombre' : undefined,
            sentido: 'asc',
          });
          if (cancelled || requestId !== browseRequestId.current) return;
          setDishResults(dishes);
          setBrowseHasMore(currentPage + 1 < totalPages);
          fetchDiscountsForDishes(dishes, discountedIdsRef.current);
        }
      } catch (err) {
        if (!cancelled && requestId === browseRequestId.current) {
          setBrowseError(err instanceof Error ? err.message : 'Error al cargar resultados');
        }
      } finally {
        if (!cancelled && requestId === browseRequestId.current) {
          setBrowseLoading(false);
          setBrowseLoadingMore(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showResults, searchQuery, searchTab, categoryKey, user?.id, fetchDiscountsForDishes]);

  const loadMoreResults = useCallback(async () => {
    if (!showResults || browseLoading || browseLoadingMore || !browseHasMore) return;

    const nextPage = browsePage + 1;
    setBrowseLoadingMore(true);

    try {
      if (searchQuery && searchTab === 'restaurantes' && selectedCategories.length === 0) {
        const { restaurants, totalPages } = await getRestaurants({
          nombre: searchQuery,
          ordenarPor: 'calificacion',
          direccion: 'desc',
          page: nextPage,
          size: PAGE_SIZE,
        });
        setRestaurantResults((prev) => [...prev, ...restaurants]);
        setBrowseHasMore(nextPage + 1 < totalPages);
      } else {
        const { dishes, totalPages, page: currentPage } = await getDishes({
          nombre: searchQuery || undefined,
          categorias: selectedCategories.length > 0 ? selectedCategories : undefined,
          pagina: nextPage,
          tamano: PAGE_SIZE,
          orden: selectedCategories.length > 0 ? 'nombre' : undefined,
          sentido: 'asc',
        });
        setDishResults((prev) => [...prev, ...dishes]);
        setBrowseHasMore(currentPage + 1 < totalPages);
        fetchDiscountsForDishes(dishes, discountedIdsRef.current);
      }
      setBrowsePage(nextPage);
    } catch (err) {
      setBrowseError(err instanceof Error ? err.message : 'Error al cargar más resultados');
    } finally {
      setBrowseLoadingMore(false);
    }
  }, [
    browseHasMore,
    browseLoading,
    browseLoadingMore,
    browsePage,
    fetchDiscountsForDishes,
    searchQuery,
    searchTab,
    selectedCategories,
    showResults,
  ]);

  function returnToHome() {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCategories([]);
    setSearchTab('platos');
    setBrowseError(null);
  }

  function handleSearch() {
    const trimmed = searchInput.trim();
    if (!trimmed && selectedCategories.length === 0) {
      returnToHome();
      return;
    }
    setSearchQuery(trimmed);
    if (!trimmed) setSearchTab('platos');
  }

  function toggleCategory(name: string) {
    setSelectedCategories((prev) => {
      const next = prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name];
      if (next.length === 0 && !searchQuery) {
        setSearchInput('');
      }
      return next;
    });
    if (searchQuery) {
      setSearchQuery('');
      setSearchInput('');
    }
  }

  const listData: ListItem[] = useMemo(() => {
    if (!showResults) return [];
    if (isDishResults) {
      return dishResults.map((data) => ({ kind: 'dish' as const, data }));
    }
    return restaurantResults.map((data) => ({ kind: 'restaurant' as const, data }));
  }, [dishResults, isDishResults, restaurantResults, showResults]);

  const listHeader = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <MagnifyingGlassIcon size={18} color={Brand.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar platos o restaurantes..."
            placeholderTextColor={Brand.gray400}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8}>
              <XMarkIcon size={18} color={Brand.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
        style={styles.chipsScroll}
      >
        {categories.map((cat) => {
          const active = selectedCategories.includes(cat.name);
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => toggleCategory(cat.name)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {showResults ? (
        <TouchableOpacity style={styles.backToHomeBtn} onPress={returnToHome} activeOpacity={0.85}>
          <XMarkIcon size={16} color={Brand.primary} />
          <Text style={styles.backToHomeText}>Volver al inicio</Text>
        </TouchableOpacity>
      ) : null}

      {showResults && searchQuery ? (
        <View style={styles.tabsRow}>
          {(['platos', 'restaurantes'] as SearchTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSearchTab(tab)}
              style={[styles.tab, searchTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, searchTab === tab && styles.tabTextActive]}>
                {tab === 'platos' ? 'Platos' : 'Restaurantes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {browseError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{browseError}</Text>
          <TouchableOpacity onPress={returnToHome}>
            <ArrowPathIcon size={18} color={Brand.primary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {!showResults ? (
        <View style={styles.homeSections}>
          {homeError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{homeError}</Text>
              <TouchableOpacity
                onPress={() => {
                  setHomeLoaded(false);
                  setHomeError(null);
                }}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {homeLoading ? (
            <ActivityIndicator size="large" color={Brand.primary} style={{ marginTop: 24 }} />
          ) : (
            <>
              {orderAgain.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    title="Pedí de nuevo"
                    onSeeAll={() => router.push('/(tabs)/explorar/platos?pedirNuevamente=true')}
                  />
                  {orderAgain.slice(0, PREVIEW_SIZE).map((d) => (
                    <DishRow key={`again-${d.id}`} item={d} discount={discounts.get(Number(d.id))} />
                  ))}
                </View>
              ) : null}

              {promoDishes.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    title="Promociones y descuentos"
                    onSeeAll={() => router.push('/(tabs)/explorar/platos?conDescuento=true')}
                  />
                  {promoDishes.map((d) => (
                    <DishRow key={`promo-${d.id}`} item={d} discount={discounts.get(Number(d.id))} />
                  ))}
                </View>
              ) : null}

              {popularDishes.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    title="Platos populares"
                    onSeeAll={() => router.push('/(tabs)/explorar/platos?orden=popularidad')}
                  />
                  {popularDishes.slice(0, PREVIEW_SIZE).map((d) => (
                    <DishRow key={`pop-${d.id}`} item={d} discount={discounts.get(Number(d.id))} />
                  ))}
                </View>
              ) : null}

              {topRestaurants.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader
                    title="Mejores locales"
                    onSeeAll={() => router.push('/(tabs)/explorar/restaurantes')}
                  />
                  {topRestaurants.map((r) => (
                    <RestaurantRow key={r.id} item={r} />
                  ))}
                </View>
              ) : null}

              {orderAgain.length === 0 &&
              promoDishes.length === 0 &&
              popularDishes.length === 0 &&
              topRestaurants.length === 0 ? (
                <Text style={styles.emptyText}>No hay contenido para mostrar todavía.</Text>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  ), [
    browseError,
    categories,
    discounts,
    homeError,
    homeLoading,
    orderAgain,
    popularDishes,
    promoDishes,
    searchInput,
    searchQuery,
    searchTab,
    selectedCategories,
    showResults,
    topRestaurants,
  ]);

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
        {listHeader}
        <GuestPrompt />
      </ScrollView>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={listData}
      keyExtractor={(item, index) =>
        item.kind === 'dish' ? `dish-${item.data.id}` : `rest-${item.data.id}-${index}`
      }
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={listHeader}
      renderItem={({ item }) =>
        item.kind === 'dish' ? (
          <DishRow item={item.data} discount={discounts.get(Number(item.data.id))} />
        ) : (
          <RestaurantRow item={item.data} />
        )
      }
      ListEmptyComponent={
        showResults && !browseLoading ? (
          <Text style={styles.emptyText}>No se encontraron resultados.</Text>
        ) : null
      }
      ListFooterComponent={
        showResults && (browseLoading || browseLoadingMore) ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={Brand.primary} />
          </View>
        ) : null
      }
      onEndReached={() => {
        if (!showResults || browseLoading || browseLoadingMore || !browseHasMore) return;
        if (endReachedGuard.current) return;
        endReachedGuard.current = true;
        void loadMoreResults();
      }}
      onMomentumScrollBegin={() => {
        endReachedGuard.current = false;
      }}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.gray100 },
  guestContent: { flexGrow: 1, justifyContent: 'center', padding: 16, gap: 16 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  listHeader: { paddingTop: 12, paddingBottom: 8, gap: 10 },

  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Brand.black },
  searchBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 44,
  },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  chipsScroll: { flexGrow: 0 },
  chipsContent: { paddingHorizontal: 4, gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.gray600 },
  chipTextActive: { color: '#fff' },

  backToHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  backToHomeText: { fontSize: 13, fontWeight: '700', color: Brand.primary },

  tabsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.gray200,
  },
  tabActive: { backgroundColor: '#FFF7ED', borderColor: Brand.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Brand.gray600 },
  tabTextActive: { color: Brand.primary },

  homeSections: { paddingBottom: 8 },
  section: { marginTop: 8, paddingHorizontal: 4, gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Brand.black },
  seeAll: { fontSize: 13, fontWeight: '600', color: Brand.primary },

  rowCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
    overflow: 'hidden',
    marginBottom: 10,
  },
  restImgWrap: {
    width: 96,
    height: 96,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restImg: { width: '100%', height: '100%' },
  restImgPlaceholder: { fontSize: 28 },
  dishImgWrap: {
    width: 96,
    height: 96,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dishImg: { width: '100%', height: '100%' },
  dishImgPlaceholder: { fontSize: 32, fontWeight: '900', color: Brand.primary },
  rowInfo: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Brand.black },
  localName: { fontSize: 12, color: Brand.gray400 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: Brand.gray600 },
  price: { fontSize: 15, fontWeight: '700', color: Brand.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  originalPrice: { fontSize: 12, color: Brand.gray400, textDecorationLine: 'line-through' },

  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextOpen: { color: '#065F46' },
  badgeTextClosed: { color: '#6B7280' },

  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Brand.primary,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  guestBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  guestTitle: { fontSize: 18, fontWeight: '800', color: Brand.black, textAlign: 'center' },
  guestText: { fontSize: 14, color: Brand.gray600, textAlign: 'center', lineHeight: 20 },
  guestButton: {
    marginTop: 8,
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  guestButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  errorBanner: {
    marginHorizontal: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  retryText: { color: Brand.primary, fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 24, marginBottom: 16, color: Brand.gray400, fontSize: 14 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
