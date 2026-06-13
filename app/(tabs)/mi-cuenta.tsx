import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { eliminarCuenta } from '@/services/cliente/cliente-service';

export default function MiCuentaScreen() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/auth/login');
    } finally {
      setLoggingOut(false);
    }
  }

  function confirmarEliminarCuenta() {
    Alert.alert(
      'Eliminar cuenta',
      'Tus datos serán anonimizados y no podrás recuperar la cuenta. Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await eliminarCuenta();
              await logout();
              router.replace('/auth/login');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mi cuenta</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/cliente/editar-perfil' as any)}>
          <Text style={styles.menuText}>Editar perfil</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/cliente/puntos-de-entrega' as any)}>
          <Text style={styles.menuText}>Puntos de entrega</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/cliente/cambiar-password' as any)}>
          <Text style={styles.menuText}>Cambiar contraseña</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Text style={styles.logoutText}>{loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Zona de peligro</Text>
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
          onPress={confirmarEliminarCuenta}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>{deleting ? 'Eliminando cuenta...' : 'Eliminar cuenta'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Brand.black },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    overflow: 'hidden',
  },
  menuItem: { paddingHorizontal: 16, paddingVertical: 14 },
  menuText: { fontSize: 15, color: Brand.black },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  divider: { height: 1, backgroundColor: Brand.gray100, marginLeft: 16 },
  dangerSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    gap: 12,
  },
  dangerTitle: { fontSize: 13, fontWeight: '700', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
