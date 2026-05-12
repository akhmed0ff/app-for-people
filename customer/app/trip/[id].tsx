import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTripRealtime } from '../../src/features/trip/useTripRealtime';
import { MapboxTripMap } from '../../src/features/map/MapboxTripMap';
import { getTaxiSocket } from '../../src/shared/socket/taxi-socket';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuthStore();
  const booking = useBookingStore();
  const { etaSeconds } = useTripRealtime(id);

  function cancelOrder() {
    if (!auth.accessToken) {
      return;
    }
    getTaxiSocket(auth.accessToken).emit('order.cancel', {
      orderId: id,
      reason: 'Passenger canceled from mobile app.',
    });
    Alert.alert('Отмена отправлена');
  }

  return (
    <Screen>
      <Text style={styles.title}>Поездка</Text>
      <MapboxTripMap
        driverLocation={booking.driverLocation}
        dropoff={booking.dropoff}
        pickup={booking.pickup}
      />
      <Section>
        <Text style={styles.label}>Статус</Text>
        <Text style={styles.status}>{booking.activeOrder?.status ?? 'SEARCHING'}</Text>
        <Text style={styles.label}>ETA</Text>
        <Text style={styles.value}>{etaSeconds ? `${Math.ceil(etaSeconds / 60)} мин` : 'Ищем'}</Text>
      </Section>
      <View style={styles.actions}>
        <Button label="Оплата" onPress={() => router.push(`/payment/${id}`)} variant="secondary" />
        <Button label="Отменить" onPress={cancelOrder} variant="danger" />
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
  label: {
    color: '#667085',
    fontWeight: '700',
  },
  status: {
    color: '#0f766e',
    fontSize: 20,
    fontWeight: '900',
  },
  value: {
    color: '#17202a',
    fontSize: 18,
    fontWeight: '800',
  },
  actions: {
    gap: 10,
    marginTop: 16,
  },
});
