import { useLocalSearchParams } from "expo-router";

import DishDetailScreen from "@/ui/dish-detail";

export default function PlatoDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DishDetailScreen id={id} />;
}
