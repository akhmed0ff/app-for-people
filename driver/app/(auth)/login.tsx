import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { registerPushNotifications } from '../../src/features/notifications/registerPushNotifications';
import { loginDriver } from '../../src/shared/api/driver-api';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { TextField } from '../../src/shared/ui/TextField';

export default function LoginScreen() {
  const [phone, setPhone] = useState('+998');
  const [loading, setLoading] = useState(false);
  const auth = useAuthStore();

  async function login() {
    try {
      setLoading(true);
      const tokens = await loginDriver(phone);
      auth.setPhone(phone);
      await auth.setTokens(tokens);
      void registerPushNotifications();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Вход не выполнен', 'Проверьте backend и DEV_LOGIN_ENABLED=true.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Водитель</Text>
      <Text style={styles.subtitle}>Войдите по номеру телефона.</Text>
      <Section>
        <TextField keyboardType="phone-pad" label="Телефон" onChangeText={setPhone} value={phone} />
        <Button disabled={loading || phone.length < 7} label="Войти" onPress={login} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#17202a',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    marginBottom: 24,
  },
});
