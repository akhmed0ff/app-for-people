import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { fetchDriverBalance } from '../../src/shared/api/driver-api';
import { useDriverStore } from '../../src/shared/store/driver.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { formatMoney } from '../../src/shared/utils/money';

export default function BalanceScreen() {
  const { balance, setBalance } = useDriverStore();

  useEffect(() => {
    void fetchDriverBalance().then(setBalance);
  }, [setBalance]);

  return (
    <Screen>
      <Text style={styles.title}>Баланс</Text>
      <Section>
        <Text style={styles.label}>Доступно</Text>
        <Text style={styles.total}>{formatMoney(balance.availableCents, balance.currency)}</Text>
        <Text style={styles.label}>В ожидании</Text>
        <Text style={styles.value}>{formatMoney(balance.pendingCents, balance.currency)}</Text>
        <Text style={styles.label}>Всего заработано</Text>
        <Text style={styles.value}>{formatMoney(balance.lifetimeEarnedCents, balance.currency)}</Text>
        <Button label="Пополнить баланс" onPress={() => router.push('/top-up')} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  label: { color: '#667085', fontWeight: '700' },
  total: { color: '#17202a', fontSize: 30, fontWeight: '900' },
  value: { color: '#17202a', fontSize: 18, fontWeight: '800' },
});
