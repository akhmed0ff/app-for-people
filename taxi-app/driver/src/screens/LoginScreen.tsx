import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';

export function LoginScreen() {
  const [phone, setPhone] = useState('+998901112244');
  const { devLogin, isLoading, error } = useAuthStore();
  const connectSocket = useSocketStore((state) => state.connect);

  const submit = async () => {
    await devLogin(phone);
    const token = useAuthStore.getState().accessToken;
    if (token) {
      connectSocket(token);
      router.replace('/home');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Taxi Driver</Text>
      <Text style={styles.subtitle}>MVP-вход водителя для локальной разработки.</Text>
      <Section>
        <Text style={styles.label}>Номер телефона</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        {error ? <StatusMessage title={error} tone="error" /> : null}
        <Button title="Войти как водитель" onPress={submit} loading={isLoading} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 40,
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    color: '#0f172a',
    fontSize: 16,
  },
});
