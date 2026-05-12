import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useTripStore } from '../store/tripStore';

export function HistoryScreen() {
  const { history, isLoading, error, loadHistory } = useTripStore();

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <Screen>
      <TopBar title="История" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
      {isLoading ? <StatusMessage title="Загружаем историю..." /> : null}
      {error ? <StatusMessage title={error} tone="error" /> : null}
      {!isLoading && history.length === 0 ? <StatusMessage title="Поездок пока нет." tone="empty" /> : null}

      {history.map((order) => (
        <Section key={order.id}>
          <View style={styles.row}>
            <Text style={styles.status}>{order.status}</Text>
            <Text style={styles.price}>{(order.finalPrice ?? order.estimatedPrice ?? 0).toLocaleString('ru-RU')} сум</Text>
          </View>
          <Text style={styles.text}>{order.pickupAddress}</Text>
          <Text style={styles.text}>{order.destinationAddress}</Text>
        </Section>
      ))}

      <Button title="Назад" onPress={() => router.back()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  status: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  price: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  text: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
