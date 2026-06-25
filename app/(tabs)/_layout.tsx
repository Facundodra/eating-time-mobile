import { router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/shared/header';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors } from '@/constants/theme';
import { useCartCount } from '@/hooks/use-cart-count';
import { useAuth } from '@/hooks/use-auth';
import { usePendingOrdersCount } from '@/hooks/use-pending-orders-count';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cartCount = useCartCount();
  const pendingOrdersCount = usePendingOrdersCount();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Brand.gray100 }}>
      <Header cartCount={cartCount} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          tabBarInactiveTintColor: Colors.light.tabIconDefault,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: Brand.gray200,
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
            ...Platform.select({
              android: { elevation: 8 },
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
              },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
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
            title: 'Pedidos en curso',
            tabBarButton: HapticTab,
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIconWrap}>
                <IconSymbol size={28} name="list.bullet" color={color} />
                {pendingOrdersCount > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            ),
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
          name="explorar/restaurantes"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="explorar/platos"
          options={{ href: null }}
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
          name="cliente/mi-billetera"
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
        <Tabs.Screen
          name="cliente/pedidos-pendientes"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/historial-pedidos"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/calificaciones-pedidos"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/dar-de-baja-cuenta"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/seguimiento-reclamos"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="cliente/iniciar-reclamo/[pedidoId]"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Brand.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
