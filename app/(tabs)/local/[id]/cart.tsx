import { useLocalSearchParams } from 'expo-router';

import RestaurantCartPage from '@/ui/restaurant-cart-page';

export default function LocalCartScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RestaurantCartPage restaurantId={Number(id)} />;
}
