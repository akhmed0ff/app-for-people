import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../../shared/api/customer-api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PUSH_TOKEN_KEY = 'customer.expoPushToken';

type NotificationData = {
  type?: string;
  orderId?: string;
  role?: string;
};

export async function registerPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  const current = await Notifications.getPermissionsAsync();
  const hasPermission = hasGrantedNotificationPermission(current)
    || hasGrantedNotificationPermission(await Notifications.requestPermissionsAsync());

  if (!hasPermission) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  try {
    const expoToken = await Notifications.getExpoPushTokenAsync();
    const token = expoToken.data;
    await registerPushToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    return expoToken;
  } catch {
    return null;
  }
}

function hasGrantedNotificationPermission(permission: unknown) {
  const status = permission as { granted?: boolean; status?: string; ios?: { status?: number } };
  return status.granted === true || status.status === 'granted' || status.ios?.status === 2;
}

export async function unregisterPushNotifications() {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!token) {
    return;
  }

  try {
    await unregisterPushToken(token);
  } catch {
    // Logout should not be blocked by a transient push unregister failure.
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

export function useCustomerNotificationResponse() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      if (data.role === 'PASSENGER' && data.orderId && data.type !== 'NEW_ORDER') {
        router.push(`/trip/${data.orderId}`);
      }
    });

    return () => subscription.remove();
  }, []);
}
