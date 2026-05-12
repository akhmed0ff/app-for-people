import '../src/features/location/location-task';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/shared/store/auth.store';

export default function RootLayout() {
  const { accessToken, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
