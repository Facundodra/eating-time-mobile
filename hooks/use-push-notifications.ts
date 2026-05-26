import { useEffect } from 'react';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerPushToken,
} from '@/services/notifications';

type UsePushNotificationsProps = {
  userId?: number | null;
};

export function usePushNotifications({ userId }: UsePushNotificationsProps) {
  useEffect(() => {
    if (!userId) return;

    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;

    const init = async () => {
      try {
        const token = await registerPushToken();
        console.log('Token push registrado:', token);

        receivedSubscription = addNotificationReceivedListener((notification) => {
          console.log('Notificación recibida:', notification);
        });

        responseSubscription = addNotificationResponseListener((response) => {
          console.log('Usuario tocó la notificación:', response);
        });
      } catch (error) {
        console.error('Error registrando push notifications:', error);
      }
    };

    init();

    return () => {
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [userId]);
}