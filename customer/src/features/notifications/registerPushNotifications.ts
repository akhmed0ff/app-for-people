import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  const current = await Notifications.getPermissionsAsync();
  const finalStatus =
    current.status === 'granted'
      ? current.status
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return Notifications.getExpoPushTokenAsync();
}
