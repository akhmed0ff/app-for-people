import '../src/features/location/location-task';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useDriverRecovery } from '../src/features/orders/useDriverRecovery';
import { useDriverNotificationResponse } from '../src/features/notifications/registerPushNotifications';
import { useAuthStore } from '../src/shared/store/auth.store';
import { useDriverStore } from '../src/shared/store/driver.store';
import { ConnectionBanner } from '../src/shared/ui/ConnectionBanner';

export default function RootLayout() {
  const { accessToken, hydrated, hydrate } = useAuthStore();
  const hydrateDriver = useDriverStore((state) => state.hydrate);
  useDriverRecovery();
  useDriverNotificationResponse();

  useEffect(() => {
    void hydrate();
    void hydrateDriver();
  }, [hydrate, hydrateDriver]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    router.replace(accessToken ? '/(tabs)' : '/(auth)/login');
  }, [accessToken, hydrated]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1d4ed8" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ConnectionBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="top-up/index" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    flex: 1,
    justifyContent: 'center',
  },
});
