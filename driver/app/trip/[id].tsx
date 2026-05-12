import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getDriverSocket } from '../../src/shared/socket/driver-socket';
import { useAuthStore } from '../../src/shared/store/auth.store';
import { useTripControls } from '../../src/features/trip/useTripControls';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const { activeOrder, updateStatus, cancel, requestEta } = useTripControls(id);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

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
      <Section>
        <Text style={styles.label}>Заказ</Text>
        <Text style={styles.value}>{id}</Text>
        <Text style={styles.label}>Статус</Text>
        <Text style={styles.status}>{activeOrder?.status ?? 'DRIVER_ASSIGNED'}</Text>
        <Text style={styles.label}>ETA</Text>
        <Text style={styles.value}>{etaSeconds ? `${Math.ceil(etaSeconds / 60)} мин` : 'Расчет'}</Text>
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
  label: { color: '#667085', fontWeight: '700' },
  value: { color: '#17202a', fontSize: 16, fontWeight: '800' },
  status: { color: '#1d4ed8', fontSize: 20, fontWeight: '900' },
  actions: { gap: 10, marginTop: 16 },
});
