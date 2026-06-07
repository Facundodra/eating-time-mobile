import { useLocalSearchParams } from "expo-router";

import RestaurantDetailScreen from "@/ui/restaurant-detail";

export default function LocalDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RestaurantDetailScreen id={id} />;
}
