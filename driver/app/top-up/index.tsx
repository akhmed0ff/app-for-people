import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useDriverStore } from '../../src/shared/store/driver.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { TextField } from '../../src/shared/ui/TextField';

export default function TopUpScreen() {
  const [amount, setAmount] = useState('50000');
  const { balance, setBalance } = useDriverStore();

  function submit() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Введите корректную сумму');
      return;
    }
    setBalance({
      ...balance,
      availableCents: balance.availableCents + parsed,
    });
    Alert.alert('Баланс пополнен');
    router.replace('/(tabs)/balance');
  }

  return (
    <Screen>
      <Text style={styles.title}>Пополнение</Text>
      <Section>
        <TextField keyboardType="number-pad" label="Сумма" onChangeText={setAmount} value={amount} />
        <Button label="Пополнить" onPress={submit} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
});
