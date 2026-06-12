import { IconShoppingCart } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import ProfileAvatar from './widgets/profile-avatar';

const logo = require('@/assets/images/logo.png');

type Props = {
  cartCount?: number;
};

export default function Header({ cartCount = 0 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.brand}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.8}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandName}>EatingTime</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/(tabs)/carrito')}
          activeOpacity={0.8}
        >
          <IconShoppingCart size={26} color={Brand.gray800} strokeWidth={1.5} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/mi-cuenta')}
            activeOpacity={0.8}
          >
            <ProfileAvatar name={user.name} size={36} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>Iniciar sesión</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 38,
    height: 38,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.black,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Brand.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: Brand.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loginText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
