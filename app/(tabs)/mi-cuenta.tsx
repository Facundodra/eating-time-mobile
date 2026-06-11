import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';

export default function MiCuentaScreen() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.text}>Mi cuenta</Text>
      <TouchableOpacity onPress={() => router.push("/cliente/editar-perfil")}>
          <Text>Editar perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/cliente/puntos-de-entrega")}>
          <Text>Puntos de entrega</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/cliente/cambiar-password")}>
          <Text>Cambiar contraseña</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutText}>
          {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  text: { fontSize: 18, fontWeight: '600', color: '#374151' },
  logoutButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
