import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MapboxTripMap } from '../../src/features/map/MapboxTripMap';
import { useBookingFlow } from '../../src/features/booking/useBookingFlow';
import { Tariff } from '../../src/shared/api/types';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { TariffCard } from '../../src/shared/ui/TariffCard';
import { TextField } from '../../src/shared/ui/TextField';
import { formatMoney } from '../../src/shared/utils/pricing';

export default function BookingScreen() {
  const booking = useBookingStore();
  const { loadTariffs, calculate, orderTaxi } = useBookingFlow();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [tariffsLoading, setTariffsLoading] = useState(false);

  useEffect(() => {
    booking.setPickup({
      address: 'Amir Temur Square',
      latitude: 41.3111,
      longitude: 69.2797,
    });
    void refreshTariffs();
  }, []);

  async function refreshTariffs() {
    setTariffsLoading(true);
    try {
      setTariffs(await loadTariffs());
    } catch {
      setTariffs([]);
    } finally {
      setTariffsLoading(false);
    }
  }

  async function selectTariff(tariff: Tariff) {
    booking.setTariff(tariff);
    try {
      await calculate(tariff);
    } catch {
      Alert.alert('Расчет недоступен', 'Проверьте подключение к backend.');
    }
  }

  async function submitOrder() {
    try {
      setLoading(true);
      await orderTaxi();
    } catch {
      Alert.alert('Заказ не создан', 'Проверьте маршрут, авторизацию и backend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Куда едем?</Text>
      <MapboxTripMap
        driverLocation={booking.driverLocation}
        dropoff={booking.dropoff}
        pickup={booking.pickup}
      />

      <Section>
        <TextField
          label="Точка А"
          onChangeText={(address) =>
            booking.setPickup({ address, latitude: 41.3111, longitude: 69.2797 })
          }
          value={booking.pickup?.address ?? ''}
        />
        <TextField
          label="Точка Б"
          onChangeText={(address) =>
            booking.setDropoff({ address, latitude: 41.3167, longitude: 69.2486 })
          }
          placeholder="Например, Tashkent City Park"
          value={booking.dropoff?.address ?? ''}
        />
      </Section>

      <View style={styles.tariffs}>
        {tariffs.map((tariff) => (
          <TariffCard
            key={tariff.id}
            onPress={() => void selectTariff(tariff)}
            selected={booking.selectedTariff?.id === tariff.id}
            tariff={tariff}
          />
        ))}
        {tariffs.length === 0 ? (
          <Section>
            <Text style={styles.empty}>
              {tariffsLoading ? 'Loading tariffs...' : 'Tariffs are unavailable.'}
            </Text>
            <Button label="Retry" onPress={() => void refreshTariffs()} variant="secondary" />
          </Section>
        ) : null}
      </View>

      {booking.estimate ? (
        <Section>
          <Text style={styles.estimate}>Стоимость</Text>
          <Text style={styles.total}>
            {formatMoney(booking.estimate.total, booking.estimate.currency)}
          </Text>
        </Section>
      ) : null}

      <Button
        disabled={loading || !booking.pickup || !booking.dropoff || !booking.selectedTariff}
        label={loading ? 'Создаем заказ' : 'Заказать'}
        onPress={submitOrder}
      />
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
  tariffs: {
    gap: 10,
    marginVertical: 16,
  },
  estimate: {
    color: '#667085',
    fontWeight: '700',
  },
  total: {
    color: '#17202a',
    fontSize: 28,
    fontWeight: '900',
  },
  empty: {
    color: '#667085',
    fontWeight: '700',
  },
});
