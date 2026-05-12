import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';

export function LoginScreen() {
  const [phone, setPhone] = useState('+998901112233');
  const { devLogin, accessToken, isLoading, error } = useAuthStore();
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View>
          <Text style={styles.title}>Taxi Passenger</Text>
          <Text style={styles.subtitle}>MVP-вход по номеру для локальной разработки.</Text>
        </View>

        <Section>
          <Text style={styles.label}>Номер телефона</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={styles.input}
            placeholder="+998901112233"
          />
          {error ? <StatusMessage title={error} tone="error" /> : null}
          <Button title="Войти как пассажир" onPress={submit} loading={isLoading} disabled={!phone || Boolean(accessToken)} />
        </Section>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
    paddingTop: 40,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
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
    backgroundColor: '#fff',
  },
});
