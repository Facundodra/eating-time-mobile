import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  MapPinIcon,
  TrashIcon,
  UserCircleIcon,
} from 'react-native-heroicons/outline';

import ProfileAvatar from '@/components/shared/widgets/profile-avatar';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePendingClaimsCount } from '@/hooks/use-pending-claims-count';
import { usePendingRatingsCount } from '@/hooks/use-pending-ratings-count';

import AccountMenuRow from './account/account-menu-row';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const pendingRatingsCount = usePendingRatingsCount();
  const pendingClaimsCount = usePendingClaimsCount();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/auth/login');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Mi cuenta</Text>
      <Text style={styles.pageSubtitle}>Configuración de tu perfil y opciones de la cuenta.</Text>

      <TouchableOpacity
        style={styles.profileCard}
        onPress={() => router.push('/cliente/editar-perfil')}
        activeOpacity={0.85}
      >
        <ProfileAvatar name={user.name} photoUrl={user.photoUrl} size={88} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={2}>{user.name}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
          <Text style={styles.profileEditHint}>Editar perfil</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.menuCard}>
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <AccountMenuRow
          title="Editar perfil"
          description="Actualizá tus datos personales."
          icon={UserCircleIcon}
          onPress={() => router.push('/cliente/editar-perfil')}
        />
        <AccountMenuRow
          title="Puntos de entrega"
          description="Gestioná las direcciones para recibir tus pedidos."
          icon={MapPinIcon}
          onPress={() => router.push('/cliente/puntos-de-entrega')}
        />
        <AccountMenuRow
          title="Cambiar contraseña"
          description="Actualizá tu contraseña de acceso."
          icon={LockClosedIcon}
          onPress={() => router.push('/cliente/cambiar-password')}
          showDivider={false}
        />
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.sectionLabel}>Pedidos</Text>
        <AccountMenuRow
          title="Historial de pedidos"
          description="Consultá tus pedidos anteriores y su estado."
          icon={ClockIcon}
          onPress={() => router.push('/cliente/historial-pedidos')}
        />
        <AccountMenuRow
          title="Calificación de pedidos"
          description="Calificá tus pedidos finalizados."
          icon={HandThumbUpIcon}
          badge={pendingRatingsCount}
          onPress={() => router.push('/cliente/calificaciones-pedidos')}
          showDivider={false}
        />
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.sectionLabel}>Reclamos</Text>
        <AccountMenuRow
          title="Seguimiento de reclamos"
          description="Consultá el estado de tus reclamos y las respuestas del local."
          icon={ChatBubbleLeftRightIcon}
          badge={pendingClaimsCount}
          onPress={() => router.push('/cliente/seguimiento-reclamos')}
          showDivider={false}
        />
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.sectionLabel}>Zona de riesgo</Text>
        <AccountMenuRow
          title="Dar de baja la cuenta"
          description="Eliminá tu cuenta de forma permanente."
          icon={TrashIcon}
          onPress={() => router.push('/cliente/dar-de-baja-cuenta')}
          danger
          showDivider={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
        onPress={() => void handleLogout()}
        disabled={loggingOut}
        activeOpacity={0.85}
      >
        {loggingOut ? (
          <ActivityIndicator color="#DC2626" size="small" />
        ) : (
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.gray100,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.black,
  },
  pageSubtitle: {
    marginTop: -8,
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.black,
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.gray400,
  },
  profileEditHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Brand.primary,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    overflow: 'hidden',
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  logoutBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
