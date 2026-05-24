import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function getFirebaseDeviceToken() {
  const tokenResponse = await Notifications.getDevicePushTokenAsync();

  // En Android con FCM debería venir el token nativo
  return tokenResponse.data;
}

export async function registerPushToken() {
  await configureNotifications();

  const granted = await requestNotificationPermissions();

  if (!granted) {
    throw new Error('Permiso de notificaciones denegado');
  }

  const token = await getFirebaseDeviceToken();

  await fetch(
    `${API_BASE_URL}/api/firebase/test?token=${encodeURIComponent(token)}`,
    { method: 'POST' }
  );

  return token;
}

export async function deletePushToken() {
  await fetch(`${API_BASE_URL}/api/firebase/test`, {
    method: 'DELETE',
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}