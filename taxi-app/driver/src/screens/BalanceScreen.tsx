import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useDriverStore } from '../store/driverStore';

export function BalanceScreen() {
  const driver = useDriverStore((state) => state.driver);

  return (
    <Screen>
      <TopBar title="Баланс" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
      <Section>
        <Text style={styles.label}>Текущий баланс</Text>
        <Text style={styles.amount}>{(driver?.balance ?? 0).toLocaleString('ru-RU')} сум</Text>
        <Text style={styles.text}>Пополнения и выплаты появятся после подключения платежного модуля.</Text>
      </Section>
      <Button title="Назад" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  text: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
