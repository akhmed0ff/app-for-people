import { router } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { registerPushNotifications } from '../../src/features/notifications/registerPushNotifications';
import { stopDriverTracking } from '../../src/features/location/driver-location.service';
import { disconnectDriverSocket } from '../../src/shared/socket/driver-socket';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { useDriverStore } from '../../src/shared/store/driver.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function ProfileScreen() {
  const auth = useAuthStore();
  const setOnline = useDriverStore((state) => state.setOnline);

  async function enablePush() {
    const token = await registerPushNotifications();
    Alert.alert(token ? 'Push включены' : 'Push недоступны', token?.data ?? 'Разрешение не выдано.');
  }

  async function logout() {
    await stopDriverTracking();
    setOnline(false);
    disconnectDriverSocket();
    await auth.logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen>
      <Text style={styles.title}>Профиль</Text>
      <Section>
        <Text style={styles.label}>Телефон</Text>
        <Text style={styles.value}>{auth.phone ?? 'Не указан'}</Text>
        <Button label="Включить push" onPress={enablePush} variant="secondary" />
        <Button label="Выйти" onPress={logout} variant="danger" />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  label: { color: '#667085', fontWeight: '700' },
  value: { color: '#17202a', fontSize: 17, fontWeight: '800' },
});
