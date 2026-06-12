import { Tabs } from 'expo-router';
import { View } from 'react-native';

import Header from '@/components/shared/header';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useCartCount } from '@/hooks/use-cart-count';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePendingRatingsCount } from '@/hooks/use-pending-ratings-count';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const cartCount = useCartCount();
  const pendingRatingsCount = usePendingRatingsCount();

  return (
    <View style={{ flex: 1 }}>
      <Header cartCount={cartCount} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarButton: HapticTab,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="mis-pedidos"
          options={{
            title: 'Mis pedidos',
            tabBarButton: HapticTab,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
            tabBarBadge: pendingRatingsCount > 0
              ? (pendingRatingsCount > 9 ? '9+' : pendingRatingsCount)
              : undefined,
            tabBarBadgeStyle: { backgroundColor: '#0EA5E9', fontSize: 10 },
          }}
        />
        <Tabs.Screen
          name="mi-cuenta"
          options={{
            title: 'Mi cuenta',
            tabBarButton: HapticTab,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="carrito"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="local/[id]/index"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="local/[id]/cart"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="local/[id]/comentarios"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="pedidos/resultado"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="plato/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/puntos-de-entrega"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/cambiar-password"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/editar-perfil"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}
