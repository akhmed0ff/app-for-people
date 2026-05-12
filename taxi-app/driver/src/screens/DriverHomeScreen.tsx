import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { MapboxPreview } from '../components/MapboxPreview';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useDriverStore } from '../store/driverStore';
import { useLocationStore } from '../store/locationStore';
import { useOrderStore } from '../store/orderStore';
import { useSocketStore } from '../store/socketStore';

export function DriverHomeScreen() {
  const { driver, currentLocation, activeOrder, isLoading, error, loadMe, updateStatus } = useDriverStore();
  const orderActive = useOrderStore((state) => state.activeOrder);
  const setActiveOrder = useOrderStore((state) => state.setActiveOrder);
  const { refreshAndSend, lastLocation, error: locationError, isLoading: locationLoading } = useLocationStore();
  const socketConnected = useSocketStore((state) => state.isConnected);
  const goOnline = useSocketStore((state) => state.goOnline);
  const goOffline = useSocketStore((state) => state.goOffline);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (activeOrder && !orderActive) {
      setActiveOrder(activeOrder);
    }
  }, [activeOrder, orderActive, setActiveOrder]);

  const toggleStatus = async () => {
    if (!driver) return;

    if (driver.status === 'ONLINE') {
      const updated = await updateStatus('OFFLINE');
      if (updated) goOffline();
      return;
    }

    const updated = await updateStatus('ONLINE');
    if (updated) goOnline();
  };

  return (
    <Screen>
      <TopBar title="Водитель" rightLabel="История" onRightPress={() => router.push('/history')} />
      <MapboxPreview location={currentLocation ?? lastLocation} order={orderActive} />

      <Section>
        <View style={styles.row}>
          <Text style={styles.status}>Статус: {driver?.status ?? '...'}</Text>
          <Text style={styles.socket}>{socketConnected ? 'online socket' : 'socket off'}</Text>
        </View>
        {error ? <StatusMessage title={error} tone="error" /> : null}
        {locationError ? <StatusMessage title={locationError} tone="error" /> : null}
        <Button
          title={driver?.status === 'ONLINE' ? 'Уйти оффлайн' : 'Выйти онлайн'}
          onPress={toggleStatus}
          loading={isLoading}
          disabled={driver?.status === 'BUSY' || driver?.status === 'BLOCKED'}
        />
        <Button
          title="Отправить геолокацию"
          onPress={refreshAndSend}
          loading={locationLoading}
          variant="secondary"
          disabled={driver?.status !== 'ONLINE' && driver?.status !== 'BUSY'}
        />
      </Section>

      <Section>
        <Text style={styles.title}>Заказы</Text>
        {orderActive ? (
          <>
            <Text style={styles.text}>{orderActive.pickupAddress}</Text>
            <Button title="Открыть активный заказ" onPress={() => router.push('/active-order')} />
          </>
        ) : (
          <>
            <StatusMessage title="Активного заказа нет." tone="empty" />
            <Button title="Доступные заказы" onPress={() => router.push('/orders')} />
          </>
        )}
      </Section>

      <Button title="Баланс" onPress={() => router.push('/balance')} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  status: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  socket: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
  },
  text: {
    color: '#334155',
    fontSize: 15,
  },
});
