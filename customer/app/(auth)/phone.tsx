import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { loginByPhone } from '../../src/shared/api/customer-api';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { TextField } from '../../src/shared/ui/TextField';

export default function PhoneAuthScreen() {
  const [phone, setPhone] = useState('+998');
  const [loading, setLoading] = useState(false);

  const { setPhone: savePhone, setTokens } = useAuthStore();

  async function submit() {
    try {
      setLoading(true);

      const tokens = await loginByPhone(phone);

      savePhone(phone);
      await setTokens(tokens);

      router.replace('/(tabs)');
    } catch {
      Alert.alert(
        'Не удалось войти',
        'Проверьте backend и DEV_LOGIN_ENABLED=true.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Вход</Text>

      <Text style={styles.subtitle}>
        Введите номер телефона пассажира.
      </Text>

      <Section>
        <TextField
          keyboardType="phone-pad"
          label="Телефон"
          onChangeText={setPhone}
          value={phone}
        />

        <Button
          disabled={loading || phone.length < 7}
          label="Продолжить"
          onPress={submit}
        />
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
