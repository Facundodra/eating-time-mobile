import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import DishesBrowseList from '@/ui/dishes-browse-list';

export default function ExplorarPlatosScreen() {
  const params = useLocalSearchParams<{
    categorias?: string;
    conDescuento?: string;
    orden?: string;
    pedirNuevamente?: string;
    q?: string;
  }>();

  const categorias = useMemo(
    () => (params.categorias
      ? params.categorias.split(',').map((c) => c.trim()).filter(Boolean)
      : undefined),
    [params.categorias],
  );

  const title = params.pedirNuevamente === 'true'
    ? 'Pedí de nuevo'
    : params.conDescuento === 'true'
      ? 'Promociones'
      : params.orden === 'popularidad'
        ? 'Platos populares'
        : 'Platos';

  return (
    <View style={{ flex: 1, backgroundColor: Brand.gray100 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeftIcon size={22} color={Brand.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      <DishesBrowseList
        initialNombre={typeof params.q === 'string' ? params.q : ''}
        initialCategorias={categorias}
        initialConDescuento={params.conDescuento === 'true'}
        initialOrden={(params.orden as 'popularidad' | 'precio' | undefined) ?? undefined}
        pedirNuevamente={params.pedirNuevamente === 'true'}
      />
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray200,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' as const, alignItems: 'center' as const },
  headerTitle: { fontSize: 17, fontWeight: '700' as const, color: Brand.black },
};
