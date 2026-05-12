import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchDriverOrders } from '../../src/shared/api/driver-api';
import { useOrdersStore } from '../../src/shared/store/orders.store';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function HistoryScreen() {
  const { history, setHistory } = useOrdersStore();

  useEffect(() => {
    void fetchDriverOrders().then(setHistory).catch(() => setHistory([]));
  }, [setHistory]);

  return (
    <Screen>
      <Text style={styles.title}>История</Text>
      <View style={styles.list}>
        {history.map((order) => (
          <Section key={order.id}>
            <Text style={styles.route}>{order.pickupAddress}</Text>
            <Text style={styles.route}>{order.dropoffAddress}</Text>
            <Text style={styles.status}>{order.status}</Text>
          </Section>
        ))}
        {history.length === 0 ? <Text style={styles.empty}>Пока нет поездок.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  list: { gap: 12 },
  route: { color: '#17202a', fontSize: 16, fontWeight: '700' },
  status: { color: '#1d4ed8', fontWeight: '800' },
  empty: { color: '#667085' },
});
