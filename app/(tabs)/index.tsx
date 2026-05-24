import { View, Button, Alert } from 'react-native';
import { registerPushToken, getFirebaseDeviceToken } from '@/services/notifications';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export default function TestPushScreen() {
  const handleRegisterToken = async () => {
    try {
      const token = await registerPushToken();
      console.log('Token registrado:', token);
      Alert.alert('OK', `Token registrado:\n${token}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo registrar el token');
    }
  };

  const handleSendTestPush = async () => {
    try {
      const token = await getFirebaseDeviceToken();
      const response = await fetch(
        `${API_BASE_URL}/api/firebase/test?token=${encodeURIComponent(token)}`,
        { method: 'POST' }
      );
      const text = await response.text();
      console.log('Respuesta test-push:', text);
      Alert.alert('Respuesta backend', text);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo ejecutar el test-push');
    }
  };

  return (
    <View style={{ marginTop: 80, gap: 16, padding: 20 }}>
      <Button title="1. Registrar token" onPress={handleRegisterToken} />
      <Button title="2. Enviar push de prueba" onPress={handleSendTestPush} />
    </View>
  );
}