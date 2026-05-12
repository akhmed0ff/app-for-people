import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useOrderStore } from '../store/orderStore';

export function HistoryScreen() {
  const { history, isLoading, error, loadHistory } = useOrderStore();

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <Screen>
      <TopBar title="История" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
      {isLoading ? <StatusMessage title="Загружаем историю..." /> : null}
      {error ? <StatusMessage title={error} tone="error" /> : null}
      {!isLoading && history.length === 0 ? <StatusMessage title="История пока пустая." tone="empty" /> : null}
      {history.map((order) => (
        <Section key={order.id}>
          <Text style={styles.status}>{order.status}</Text>
          <Text style={styles.text}>{order.pickupAddress}</Text>
          <Text style={styles.text}>{order.destinationAddress}</Text>
          <Text style={styles.price}>{(order.finalPrice ?? order.estimatedPrice ?? 0).toLocaleString('ru-RU')} сум</Text>
        </Section>
      ))}
      <Button title="Назад" onPress={() => router.back()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  text: {
    color: '#475569',
    fontSize: 14,
  },
  price: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
});
