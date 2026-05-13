import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useCustomerNotificationResponse } from '../src/features/notifications/registerPushNotifications';
import { useCustomerRecovery } from '../src/features/trip/useCustomerRecovery';
import { useAuthStore } from '../src/shared/store/auth.store';
import { ConnectionBanner } from '../src/shared/ui/ConnectionBanner';

export default function RootLayout() {
  const { accessToken, hydrated, hydrate } = useAuthStore();
  useCustomerRecovery();
  useCustomerNotificationResponse();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    router.replace(accessToken ? '/(tabs)' : '/(auth)/phone');
  }, [accessToken, hydrated]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0f766e" />
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
        <Stack.Screen name="payment/[id]" />
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
