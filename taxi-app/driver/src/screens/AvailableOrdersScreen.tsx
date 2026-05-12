import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useOrderStore } from '../store/orderStore';
import { useSocketStore } from '../store/socketStore';

export function AvailableOrdersScreen() {
  const { availableOrders, isLoading, error, loadAvailable, accept } = useOrderStore();
  const joinOrder = useSocketStore((state) => state.joinOrder);

  useEffect(() => {
    void loadAvailable();
  }, [loadAvailable]);

  const submit = async (orderId: string) => {
    const order = await accept(orderId);
    if (order) {
      joinOrder(order.id);
      router.replace('/active-order');
    }
  };

  return (
    <Screen>
      <TopBar title="Заказы" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
      {isLoading ? <StatusMessage title="Загружаем заказы..." /> : null}
      {error ? <StatusMessage title={error} tone="error" /> : null}
      {!isLoading && availableOrders.length === 0 ? <StatusMessage title="Свободных заказов пока нет." tone="empty" /> : null}

      {availableOrders.map((order) => (
        <Section key={order.id}>
          <Text style={styles.title}>{order.pickupAddress}</Text>
          <Text style={styles.text}>{order.destinationAddress}</Text>
          <Text style={styles.price}>{(order.estimatedPrice ?? 0).toLocaleString('ru-RU')} сум</Text>
          <Button title="Принять заказ" onPress={() => submit(order.id)} loading={isLoading} />
        </Section>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#0f172a',
    fontSize: 17,
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
