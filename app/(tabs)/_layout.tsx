import { Tabs } from 'expo-router';
import { View } from 'react-native';

import Header from '@/components/shared/header';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <Header />
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
          name="local/[id]/comentarios"
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
      </Tabs>
    </View>
  );
}
