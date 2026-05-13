import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MapboxTripMap } from '../../src/features/map/MapboxTripMap';
import { useTripRealtime } from '../../src/features/trip/useTripRealtime';
import { getTaxiSocket } from '../../src/shared/socket/taxi-socket';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { formatMoney } from '../../src/shared/utils/pricing';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuthStore();
  const booking = useBookingStore();
  const { etaSeconds } = useTripRealtime(id);
  const order = booking.activeOrder;
  const canCancel = ['SEARCHING_DRIVER', 'NO_DRIVERS_AVAILABLE', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED'].includes(
    booking.tripState,
  );

  function cancelOrder() {
    if (!auth.accessToken || !order) {
      return;
    }
    getTaxiSocket(auth.accessToken).emit('order.cancel', {
      orderId: order.id,
      reason: 'Passenger canceled from mobile app.',
    });
    booking.handleOrderCanceled({ ...order, status: 'CANCELED' });
    Alert.alert('Заказ отменен');
  }

  async function continueSearch() {
    useBookingStore.setState({ tripState: 'SEARCHING_DRIVER', error: null });
    await booking.syncActiveOrder();
  }

  function done() {
    booking.clearActiveOrder();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <Text style={styles.title}>{titleForState(booking.tripState)}</Text>
      <MapboxTripMap
        driverLocation={booking.driverLocation}
        dropoff={booking.dropoff}
        pickup={booking.pickup}
      />
      <TripStateSection etaSeconds={etaSeconds} />
      <View style={styles.actions}>
        {booking.tripState === 'NO_DRIVERS_AVAILABLE' ? (
          <Button label="Продолжить поиск" onPress={() => void continueSearch()} variant="secondary" />
        ) : null}
        {canCancel ? <Button label="Отменить заказ" onPress={cancelOrder} variant="danger" /> : null}
        {booking.tripState === 'COMPLETED' ? <Button label="Готово" onPress={done} /> : null}
        {booking.tripState === 'CANCELED' ? <Button label="На главную" onPress={done} /> : null}
      </View>
    </Screen>
  );
}

function TripStateSection({ etaSeconds }: { etaSeconds: number | null }) {
  const booking = useBookingStore();
  const order = booking.activeOrder;
  const driver = booking.assignedDriver;
  const driverName = [driver?.user?.firstName, driver?.user?.lastName].filter(Boolean).join(' ');

  if (booking.tripState === 'SEARCHING_DRIVER') {
    return (
      <Section>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.value}>Предлагаем заказ ближайшим водителям</Text>
      </Section>
    );
  }

  if (booking.tripState === 'NO_DRIVERS_AVAILABLE') {
    return (
      <Section>
        <Text style={styles.value}>Можно подождать или отменить заказ.</Text>
        <Text style={styles.muted}>Поблизости нет свободных водителей.</Text>
      </Section>
    );
  }

  if (booking.tripState === 'DRIVER_ASSIGNED') {
    return (
      <Section>
        <Text style={styles.label}>Водитель</Text>
        <Text style={styles.value}>{driverName || 'Водитель назначен'}</Text>
        {driver?.user?.phone ? <Text style={styles.muted}>{driver.user.phone}</Text> : null}
        <Text style={styles.label}>Автомобиль</Text>
        <Text style={styles.value}>
          {[driver?.vehicleMake, driver?.vehicleModel, driver?.vehicleColor].filter(Boolean).join(' ') || '-'}
        </Text>
        <Text style={styles.value}>{driver?.vehiclePlate ?? '-'}</Text>
        <Text style={styles.label}>ETA</Text>
        <Text style={styles.value}>{etaSeconds ? `${Math.ceil(etaSeconds / 60)} мин` : 'Рассчитываем'}</Text>
      </Section>
    );
  }

  if (booking.tripState === 'DRIVER_ARRIVED') {
    return (
      <Section>
        <Text style={styles.value}>Можете выходить к автомобилю.</Text>
      </Section>
    );
  }

  if (booking.tripState === 'IN_PROGRESS') {
    return (
      <Section>
        <Text style={styles.label}>Назначение</Text>
        <Text style={styles.value}>{order?.dropoffAddress ?? '-'}</Text>
        <Text style={styles.muted}>Поездка началась</Text>
      </Section>
    );
  }

  if (booking.tripState === 'COMPLETED') {
    return (
      <Section>
        <Text style={styles.label}>Финальная стоимость</Text>
        <Text style={styles.total}>{formatMoney(order?.fareCents ?? booking.estimate?.estimatedPrice ?? 0, order?.currency ?? 'UZS')}</Text>
      </Section>
    );
  }

  if (booking.tripState === 'CANCELED') {
    return (
      <Section>
        <Text style={styles.value}>Заказ отменен.</Text>
      </Section>
    );
  }

  return (
    <Section>
      <Text style={styles.value}>Обновляем статус поездки.</Text>
    </Section>
  );
}

function titleForState(state: string) {
  switch (state) {
    case 'SEARCHING_DRIVER':
      return 'Ищем водителя';
    case 'NO_DRIVERS_AVAILABLE':
      return 'Пока нет свободных водителей';
    case 'DRIVER_ASSIGNED':
      return 'Водитель найден';
    case 'DRIVER_ARRIVED':
      return 'Водитель прибыл';
    case 'IN_PROGRESS':
      return 'Вы в пути';
    case 'COMPLETED':
      return 'Поездка завершена';
    case 'CANCELED':
      return 'Заказ отменен';
    default:
      return 'Поездка';
  }
}

const styles = StyleSheet.create({
  actions: { gap: 10, marginTop: 16 },
  label: { color: '#667085', fontWeight: '700' },
  muted: { color: '#667085', fontSize: 15, fontWeight: '700' },
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  total: { color: '#17202a', fontSize: 28, fontWeight: '900' },
  value: { color: '#17202a', fontSize: 18, fontWeight: '800' },
});
