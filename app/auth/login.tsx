import { router } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity} from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Iniciar sesión</Text>
      <TouchableOpacity onPress={() => router.push("/auth/register")}>
        <Text>Crear una cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, fontWeight: '600', color: '#374151' },
});
