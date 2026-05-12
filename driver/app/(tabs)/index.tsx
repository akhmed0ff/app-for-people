import { StyleSheet, Text, View } from 'react-native';
import { useDriverRealtime } from '../../src/features/orders/useDriverRealtime';
import { Button } from '../../src/shared/ui/Button';
import { OrderOfferCard } from '../../src/shared/ui/OrderOfferCard';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function OrdersScreen() {
  const { online, connecting, queue, goOnline, goOffline, acceptOrder } = useDriverRealtime();

  return (
    <Screen>
      <Text style={styles.title}>Очередь заказов</Text>
      <Section>
        <Text style={styles.status}>{online ? 'Вы онлайн' : 'Вы оффлайн'}</Text>
        <Button
          disabled={connecting}
          label={online ? 'Уйти с линии' : 'Выйти на линию'}
          onPress={online ? goOffline : goOnline}
          variant={online ? 'danger' : 'primary'}
        />
      </Section>
      <View style={styles.list}>
        {queue.map((offer) => (
          <OrderOfferCard
            key={offer.orderId}
            offer={offer}
            onAccept={() => acceptOrder(offer.orderId)}
          />
        ))}
        {queue.length === 0 ? <Text style={styles.empty}>Новые заказы появятся здесь.</Text> : null}
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
  status: {
    color: '#17202a',
    fontSize: 18,
    fontWeight: '900',
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  empty: {
    color: '#667085',
  },
});
