import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchOrders } from '../../src/shared/api/customer-api';
import { Order } from '../../src/shared/api/types';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function HistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void fetchOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <Screen>
      <Text style={styles.title}>История поездок</Text>
      <View style={styles.list}>
        {orders.map((order) => (
          <Section key={order.id}>
            <Text style={styles.route}>{order.pickupAddress}</Text>
            <Text style={styles.route}>{order.dropoffAddress}</Text>
            <Text style={styles.status}>{order.status}</Text>
          </Section>
        ))}
        {orders.length === 0 ? <Text style={styles.empty}>Пока нет поездок.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#17202a',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  route: {
    color: '#17202a',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    color: '#0f766e',
    fontWeight: '800',
  },
  empty: {
    color: '#667085',
  },
});
