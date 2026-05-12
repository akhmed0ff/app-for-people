import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useSocketStore } from '../src/store/socketStore';

export default function IndexRoute() {
  const { accessToken, isRestoring, restore } = useAuthStore();
  const connectSocket = useSocketStore((state) => state.connect);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (isRestoring) return;

    if (accessToken) {
      connectSocket(accessToken);
      router.replace('/home');
      return;
    }

    router.replace('/login');
  }, [accessToken, connectSocket, isRestoring]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color="#111827" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});
