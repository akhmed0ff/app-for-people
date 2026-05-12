import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { MapboxPreview } from '../components/MapboxPreview';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useLocationStore } from '../store/locationStore';
import { useSocketStore } from '../store/socketStore';
import { useTripStore } from '../store/tripStore';
import { OrderStatus } from '../types/api';

const statusLabels: Record<OrderStatus, string> = {
  SEARCHING: 'Ищем водителя',
  DRIVER_ASSIGNED: 'Водитель назначен',
  DRIVER_ARRIVED: 'Водитель приехал',
  IN_PROGRESS: 'Поездка началась',
  COMPLETED: 'Поездка завершена',
  CANCELED: 'Заказ отменен',
};

export function TripScreen() {
  const route = useLocationStore((state) => state.route);
  const activeOrder = useTripStore((state) => state.activeOrder);
  const driverLocation = useTripStore((state) => state.driverLocation);
  const cancelActiveOrder = useTripStore((state) => state.cancelActiveOrder);
  const isLoading = useTripStore((state) => state.isLoading);
  const error = useTripStore((state) => state.error);
  const joinOrder = useSocketStore((state) => state.joinOrder);

  useEffect(() => {
    if (activeOrder) {
      joinOrder(activeOrder.id);
    }
  }, [activeOrder, joinOrder]);

  if (!activeOrder) {
    return (
      <Screen>
        <TopBar title="Поездка" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
        <StatusMessage title="Активного заказа нет." tone="empty" />
        <Button title="Создать заказ" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  const canCancel = activeOrder.status === 'SEARCHING' || activeOrder.status === 'DRIVER_ASSIGNED';

  return (
    <Screen>
      <TopBar title="Поездка" rightLabel="История" />
      <MapboxPreview route={route} driverLocation={driverLocation} />

      <Section>
        <Text style={styles.status}>{statusLabels[activeOrder.status]}</Text>
        <Text style={styles.text}>Заказ: {activeOrder.id}</Text>
        <Text style={styles.text}>
          Цена: {(activeOrder.finalPrice ?? activeOrder.estimatedPrice ?? 0).toLocaleString('ru-RU')} сум
        </Text>
        {activeOrder.driverId ? <Text style={styles.text}>Водитель: {activeOrder.driverId}</Text> : null}
        {driverLocation ? (
          <Text style={styles.text}>
            Координаты водителя: {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
          </Text>
        ) : (
          <StatusMessage title="Координаты водителя появятся после назначения." tone="empty" />
        )}
        {error ? <StatusMessage title={error} tone="error" /> : null}
        {canCancel ? (
          <Button title="Отменить заказ" onPress={cancelActiveOrder} loading={isLoading} variant="danger" />
        ) : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
  },
  text: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
});
