import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { pricingApi } from '../api/pricing';
import { tariffsApi } from '../api/tariffs';
import { Button } from '../components/Button';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useLocationStore } from '../store/locationStore';
import { useSocketStore } from '../store/socketStore';
import { useTripStore } from '../store/tripStore';
import { PriceEstimate, Tariff } from '../types/api';

export function TariffScreen() {
  const route = useLocationStore((state) => state.route);
  const createOrder = useTripStore((state) => state.createOrder);
  const isCreating = useTripStore((state) => state.isLoading);
  const joinOrder = useSocketStore((state) => state.joinOrder);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selected, setSelected] = useState<Tariff | null>(null);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    tariffsApi
      .getAll()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setTariffs(items);
        setSelected(items[0] ?? null);
      })
      .catch(() => setError('Не удалось загрузить тарифы.'))
      .finally(() => setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }

    setEstimate(null);
    pricingApi
      .estimate({
        tariffCode: selected.code,
        distanceKm: route.distanceKm,
        waitingMinutes: 0,
        stopMinutes: 0,
      })
      .then(setEstimate)
      .catch(() => setError('Не удалось рассчитать стоимость.'));
  }, [route.distanceKm, selected]);

  const submit = async () => {
    if (!selected) {
      return;
    }

    const order = await createOrder({
      tariffCode: selected.code,
      pickupAddress: route.pickup.address,
      pickupLat: route.pickup.lat,
      pickupLng: route.pickup.lng,
      destinationAddress: route.destination.address,
      destinationLat: route.destination.lat,
      destinationLng: route.destination.lng,
      distanceKm: route.distanceKm,
    });

    if (order) {
      joinOrder(order.id);
      router.replace('/trip');
    }
  };

  return (
    <Screen>
      <TopBar title="Тариф" rightLabel="Назад" onRightPress={() => router.back()} />

      {isLoading ? <StatusMessage title="Загружаем тарифы..." /> : null}
      {error ? <StatusMessage title={error} tone="error" /> : null}
      {!isLoading && tariffs.length === 0 ? <StatusMessage title="Активных тарифов пока нет." tone="empty" /> : null}

      {tariffs.map((tariff) => (
        <Pressable
          key={tariff.id}
          onPress={() => setSelected(tariff)}
          style={[styles.tariff, selected?.id === tariff.id && styles.selected]}
        >
          <View>
            <Text style={styles.name}>{tariff.name}</Text>
            <Text style={styles.meta}>{tariff.pricePerKm.toLocaleString('ru-RU')} сум/км</Text>
          </View>
          <Text style={styles.price}>от {tariff.minimumFare.toLocaleString('ru-RU')}</Text>
        </Pressable>
      ))}

      <Section>
        <Text style={styles.title}>Расчет</Text>
        {estimate ? (
          <>
            <Text style={styles.line}>Подача: {estimate.baseFare.toLocaleString('ru-RU')} сум</Text>
            <Text style={styles.line}>Дистанция: {estimate.distancePrice.toLocaleString('ru-RU')} сум</Text>
            <Text style={styles.total}>Итого: {estimate.totalPrice.toLocaleString('ru-RU')} сум</Text>
          </>
        ) : (
          <StatusMessage title="Считаем стоимость..." />
        )}
        <Button title="Заказать" onPress={submit} loading={isCreating} disabled={!selected || !estimate} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tariff: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 14,
  },
  selected: {
    borderColor: '#111827',
    backgroundColor: '#f8fafc',
  },
  name: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  price: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  line: {
    color: '#334155',
    fontSize: 14,
  },
  total: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
});
