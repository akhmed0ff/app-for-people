import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getDriverSocket } from '../../src/shared/socket/driver-socket';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { useDriverStore } from '../../src/shared/store/driver.store';
import { useTripControls } from '../../src/features/trip/useTripControls';
import { Button } from '../../src/shared/ui/Button';
import { RoutePreviewMap } from '../../src/shared/ui/RoutePreviewMap';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { formatMoney } from '../../src/shared/utils/money';
import {
  getOrderDestination,
  getOrderDistanceKm,
  getOrderEstimatedPrice,
  getOrderEtaMinutes,
} from '../../src/shared/utils/route';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const location = useDriverStore((state) => state.location);
  const { activeOrder, updateStatus, cancel, requestEta } = useTripControls(id);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const destination = getOrderDestination(activeOrder);
  const distanceKm = getOrderDistanceKm(activeOrder);
  const routeEtaMinutes = getOrderEtaMinutes(activeOrder);
  const estimatedPrice = getOrderEstimatedPrice(activeOrder);
  const passengerName = [
    activeOrder?.passenger?.user?.firstName,
    activeOrder?.passenger?.user?.lastName,
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!token) {
      return;
    }
    const socket = getDriverSocket(token);
    function handleEta(eta: { orderId: string; etaSeconds: number }) {
      if (eta.orderId === id) {
        setEtaSeconds(eta.etaSeconds);
      }
    }

    socket.on('eta.updated', handleEta);
    const timer = setInterval(requestEta, 15000);
    requestEta();
    return () => {
      socket.off('eta.updated', handleEta);
      clearInterval(timer);
    };
  }, [id, requestEta, token]);

  return (
    <Screen>
      <Text style={styles.title}>Активная поездка</Text>
      <RoutePreviewMap driverLocation={location} order={activeOrder} />
      <Section>
        <Text style={styles.label}>Заказ</Text>
        <Text style={styles.value}>{id}</Text>
        <Text style={styles.label}>Статус</Text>
        <Text style={styles.status}>{activeOrder?.status ?? 'DRIVER_ASSIGNED'}</Text>
      </Section>

      <Section>
        <Text style={styles.label}>Подача</Text>
        <Text style={styles.value}>{activeOrder?.pickupAddress ?? '-'}</Text>
        <Text style={styles.label}>Назначение</Text>
        <Text style={styles.value}>{destination?.address ?? '-'}</Text>
      </Section>

      <Section>
        <Text style={styles.label}>Маршрут</Text>
        <Text style={styles.value}>{distanceKm ? `${distanceKm.toFixed(1)} км` : 'Расстояние недоступно'}</Text>
        <Text style={styles.label}>ETA маршрута</Text>
        <Text style={styles.value}>
          {routeEtaMinutes ? `${routeEtaMinutes} мин` : etaSeconds ? `${Math.ceil(etaSeconds / 60)} мин` : 'Расчет'}
        </Text>
        <Text style={styles.label}>Примерная цена</Text>
        <Text style={styles.value}>{estimatedPrice ? formatMoney(estimatedPrice, activeOrder?.currency) : '-'}</Text>
      </Section>

      <Section>
        <Text style={styles.label}>Пассажир</Text>
        <Text style={styles.value}>{passengerName || 'Данные пассажира недоступны'}</Text>
        {activeOrder?.passenger?.user?.phone ? (
          <Text style={styles.muted}>{activeOrder.passenger.user.phone}</Text>
        ) : null}
      </Section>

      <View style={styles.actions}>
        <Button label="Я прибыл" onPress={() => updateStatus('DRIVER_ARRIVED')} />
        <Button label="Начать поездку" onPress={() => updateStatus('IN_PROGRESS')} />
        <Button
          label="Завершить"
          onPress={() => {
            updateStatus('COMPLETED');
            router.replace('/(tabs)/balance');
          }}
          variant="secondary"
        />
        <Button label="Отменить" onPress={cancel} variant="danger" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  label: { color: '#667085', fontWeight: '700', marginTop: 6 },
  muted: { color: '#667085', fontSize: 15, fontWeight: '700' },
  value: { color: '#17202a', fontSize: 16, fontWeight: '800' },
  status: { color: '#1d4ed8', fontSize: 20, fontWeight: '900' },
  actions: { gap: 10, marginTop: 16 },
});
