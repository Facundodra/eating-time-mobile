import { router, useLocalSearchParams } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import RestaurantList from '@/ui/restaurant-list';

export default function ExplorarRestaurantesScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: Brand.gray100 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeftIcon size={22} color={Brand.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurantes</Text>
        <View style={styles.backBtn} />
      </View>
      <RestaurantList initialNombre={typeof q === 'string' ? q : ''} />
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
