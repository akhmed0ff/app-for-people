import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { MapboxPreview } from '../components/MapboxPreview';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useDriverStore } from '../store/driverStore';
import { useOrderStore } from '../store/orderStore';

export function ActiveOrderScreen() {
  const { activeOrder, arrived, start, complete } = useOrderStore();
  const currentLocation = useDriverStore((state) => state.currentLocation);
  const [distanceKm, setDistanceKm] = useState('4.9');
  const [waitingMinutes, setWaitingMinutes] = useState('0');
  const [stopMinutes, setStopMinutes] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  if (!activeOrder) {
    return (
      <Screen>
        <TopBar title="Активный заказ" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
        <StatusMessage title="Активного заказа нет." tone="empty" />
      </Screen>
    );
  }

  const run = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const completeTrip = async () => {
    await run(async () => {
      await complete({
        distanceKm: Number(distanceKm),
        waitingMinutes: Number(waitingMinutes),
        stopMinutes: Number(stopMinutes),
      });
      router.replace('/home');
    });
  };

  return (
    <Screen>
      <TopBar title="Активный заказ" rightLabel="Домой" onRightPress={() => router.replace('/home')} />
      <MapboxPreview order={activeOrder} location={currentLocation} />

      <Section>
        <Text style={styles.status}>{activeOrder.status}</Text>
        <Text style={styles.text}>Подача: {activeOrder.pickupAddress}</Text>
        <Text style={styles.text}>Назначение: {activeOrder.destinationAddress}</Text>
        <Text style={styles.price}>{(activeOrder.estimatedPrice ?? 0).toLocaleString('ru-RU')} сум</Text>
      </Section>

      <Section>
        {activeOrder.status === 'DRIVER_ASSIGNED' ? (
          <Button title="Я прибыл" onPress={() => run(arrived)} loading={isLoading} />
        ) : null}
        {activeOrder.status === 'DRIVER_ARRIVED' ? (
          <Button title="Начать поездку" onPress={() => run(start)} loading={isLoading} />
        ) : null}
        {activeOrder.status === 'IN_PROGRESS' ? (
          <>
            <View style={styles.grid}>
              <Input label="Км" value={distanceKm} onChangeText={setDistanceKm} />
              <Input label="Ожидание" value={waitingMinutes} onChangeText={setWaitingMinutes} />
              <Input label="Остановки" value={stopMinutes} onChangeText={setStopMinutes} />
            </View>
            <Button title="Завершить поездку" onPress={completeTrip} loading={isLoading} />
          </>
        ) : null}
      </Section>
    </Screen>
  );
}

function Input({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="numeric" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  text: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  price: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    color: '#0f172a',
  },
});
