import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MapboxTripMap } from '../../src/features/map/MapboxTripMap';
import { useBookingFlow } from '../../src/features/booking/useBookingFlow';
import { estimateRoute } from '../../src/shared/api/customer-api';
import { AddressSuggestion, RouteEstimate, Tariff } from '../../src/shared/api/types';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { AddressSearchInput } from '../../src/shared/ui/AddressSearchInput';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { TariffCard } from '../../src/shared/ui/TariffCard';
import { formatMoney } from '../../src/shared/utils/pricing';

type EstimateState = {
  estimate: RouteEstimate | null;
  isLoading: boolean;
  error: string | null;
};

const MIN_ROUTE_DISTANCE_KM = 0.05;

export default function BookingScreen() {
  const booking = useBookingStore();
  const { loadTariffs, orderTaxi } = useBookingFlow();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [routeEstimating, setRouteEstimating] = useState(false);
  const [estimateByTariff, setEstimateByTariff] = useState<Record<string, EstimateState>>({});
  const lastEstimateKey = useRef<string | null>(null);
  const hasActiveTrip = Boolean(
    booking.activeOrder &&
      ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(booking.activeOrder.status),
  );
  const routeDistanceKm = booking.pickup && booking.dropoff ? distanceKm(booking.pickup, booking.dropoff) : null;
  const hasRoutePoints = Boolean(
    booking.pickup?.address.trim() &&
      booking.dropoff?.address.trim() &&
      routeDistanceKm !== null &&
      routeDistanceKm >= MIN_ROUTE_DISTANCE_KM,
  );

  const routeKey = useMemo(() => {
    if (!booking.pickup || !booking.dropoff || !hasRoutePoints) {
      return null;
    }
    return [
      booking.pickup.address.trim(),
      booking.pickup.latitude,
      booking.pickup.longitude,
      booking.dropoff.address.trim(),
      booking.dropoff.latitude,
      booking.dropoff.longitude,
      tariffs.map((tariff) => tariff.code).join(','),
    ].join('|');
  }, [booking.dropoff, booking.pickup, hasRoutePoints, tariffs]);

  useEffect(() => {
    void refreshTariffs();
  }, []);

  useEffect(() => {
    if (!routeKey || tariffs.length === 0 || !booking.pickup || !booking.dropoff) {
      setEstimateByTariff({});
      booking.setEstimate(null);
      lastEstimateKey.current = null;
      return;
    }

    if (lastEstimateKey.current === routeKey) {
      return;
    }

    lastEstimateKey.current = routeKey;
    void calculateTariffEstimates(tariffs);
  }, [routeKey]);

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

  async function calculateTariffEstimates(nextTariffs: Tariff[]) {
    if (!booking.pickup || !booking.dropoff || !hasRoutePoints) {
      return;
    }

    setRouteEstimating(true);
    setEstimateByTariff(
      Object.fromEntries(
        nextTariffs.map((tariff) => [tariff.code, { estimate: null, isLoading: true, error: null }]),
      ),
    );

    const results = await Promise.all(
      nextTariffs.map(async (tariff) => {
        try {
          const estimate = await estimateRoute({
            pickupLat: booking.pickup!.latitude,
            pickupLng: booking.pickup!.longitude,
            destinationLat: booking.dropoff!.latitude,
            destinationLng: booking.dropoff!.longitude,
            tariffCode: tariff.code,
          });
          return [tariff.code, { estimate, isLoading: false, error: null }] as const;
        } catch {
          return [
            tariff.code,
            {
              estimate: null,
              isLoading: false,
              error: 'Не удалось построить маршрут',
            },
          ] as const;
        }
      }),
    );

    const nextState = Object.fromEntries(results);
    setEstimateByTariff(nextState);
    setRouteEstimating(false);

    const selected = booking.selectedTariff ? nextState[booking.selectedTariff.code]?.estimate : null;
    if (selected) {
      booking.setEstimate(selected);
      return;
    }

    const firstAvailable = nextTariffs.find((tariff) => nextState[tariff.code]?.estimate);
    if (firstAvailable) {
      booking.setTariff(firstAvailable);
      booking.setEstimate(nextState[firstAvailable.code].estimate);
    } else {
      booking.setEstimate(null);
    }
  }

  function selectAddress(kind: 'pickup' | 'dropoff', suggestion: AddressSuggestion) {
    const point = {
      address: suggestion.fullAddress,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
    };
    if (kind === 'pickup') {
      booking.setPickup(point);
    } else {
      booking.setDropoff(point);
    }
  }

  async function useCurrentLocation() {
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Геолокация недоступна', 'Разрешите доступ к геолокации или выберите адрес вручную.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      booking.setPickup({
        address: 'Моя текущая геолокация',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch {
      Alert.alert('Геолокация недоступна', 'Не удалось получить текущую позицию.');
    } finally {
      setLocationLoading(false);
    }
  }

  function selectTariff(tariff: Tariff) {
    const state = estimateByTariff[tariff.code];
    if (!state?.estimate) {
      Alert.alert('Тариф недоступен', state?.error ?? 'Не удалось построить маршрут');
      return;
    }
    booking.setTariff(tariff);
    booking.setEstimate(state.estimate);
  }

  async function submitOrder() {
    if (hasActiveTrip) {
      Alert.alert('У вас уже есть активная поездка', 'Откройте текущую поездку перед созданием новой.');
      return;
    }
    if (!booking.pickup || !booking.dropoff) {
      Alert.alert('Проверьте точки поездки', 'Выберите точку подачи и пункт назначения.');
      return;
    }
    if (!hasRoutePoints) {
      Alert.alert('Проверьте точки поездки', 'Точка подачи и назначение слишком близко друг к другу.');
      return;
    }
    if (!booking.selectedTariff || !booking.estimate) {
      Alert.alert('Тариф недоступен', 'Дождитесь расчета маршрута и выберите доступный тариф.');
      return;
    }

    try {
      setLoading(true);
      await orderTaxi();
    } catch {
      Alert.alert('Заказ не создан', 'Проверьте маршрут, авторизацию и доступность backend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Куда едем?</Text>
      {hasActiveTrip ? (
        <Section>
          <Text style={styles.estimate}>У вас активная поездка</Text>
          <Text style={styles.value}>{tripStatusText(booking.activeOrder?.status)}</Text>
          <Button label="Открыть поездку" onPress={() => router.push(`/trip/${booking.activeOrder?.id}`)} />
        </Section>
      ) : null}
      <MapboxTripMap
        driverLocation={booking.driverLocation}
        dropoff={booking.dropoff}
        pickup={booking.pickup}
      />

      <Section>
        <AddressSearchInput
          label="Откуда"
          onClear={() => booking.setPickup(null)}
          onSelect={(suggestion) => selectAddress('pickup', suggestion)}
          placeholder="Введите адрес подачи"
          value={booking.pickup?.address ?? ''}
        />
        <Button
          label={locationLoading ? 'Определяем...' : 'Использовать текущую геолокацию'}
          onPress={() => void useCurrentLocation()}
          variant="secondary"
        />
        <AddressSearchInput
          label="Куда"
          onClear={() => booking.setDropoff(null)}
          onSelect={(suggestion) => selectAddress('dropoff', suggestion)}
          placeholder="Введите адрес назначения"
          value={booking.dropoff?.address ?? ''}
        />
        {booking.pickup && booking.dropoff && !hasRoutePoints ? (
          <Text style={styles.errorText}>Точки слишком близко друг к другу</Text>
        ) : null}
      </Section>

      <View style={styles.tariffs}>
        {routeEstimating ? <Text style={styles.loading}>Считаем маршруты и стоимость...</Text> : null}
        {tariffs.map((tariff) => {
          const state = estimateByTariff[tariff.code];
          return (
            <TariffCard
              disabled={hasActiveTrip || !hasRoutePoints || state?.isLoading || !state?.estimate}
              error={state?.error}
              estimate={state?.estimate}
              key={tariff.id}
              loading={state?.isLoading}
              onPress={() => selectTariff(tariff)}
              selected={booking.selectedTariff?.id === tariff.id}
              tariff={tariff}
            />
          );
        })}
        {tariffs.length === 0 ? (
          <Section>
            <Text style={styles.empty}>
              {tariffsLoading ? 'Загружаем тарифы...' : 'Тарифы недоступны.'}
            </Text>
            <Button label="Повторить" onPress={() => void refreshTariffs()} variant="secondary" />
          </Section>
        ) : null}
      </View>

      {booking.estimate ? (
        <Section>
          <Text style={styles.estimate}>Стоимость поездки</Text>
          <Text style={styles.total}>{formatMoney(booking.estimate.estimatedPrice)}</Text>
          <Text style={styles.meta}>
            {booking.estimate.distanceKm.toFixed(1)} км • {booking.estimate.durationMinutes} мин
          </Text>
        </Section>
      ) : null}

      <Button
        disabled={
          loading ||
          routeEstimating ||
          hasActiveTrip ||
          !hasRoutePoints ||
          !booking.selectedTariff ||
          !booking.estimate
        }
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
  meta: {
    color: '#667085',
    marginTop: 6,
  },
  loading: {
    color: '#667085',
    fontWeight: '700',
  },
  empty: {
    color: '#667085',
    fontWeight: '700',
  },
  errorText: {
    color: '#b42318',
    fontWeight: '700',
  },
  value: {
    color: '#17202a',
    fontSize: 18,
    fontWeight: '800',
  },
});

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tripStatusText(status?: string) {
  switch (status) {
    case 'SEARCHING':
      return 'Ищем водителя';
    case 'DRIVER_ASSIGNED':
      return 'Водитель найден';
    case 'DRIVER_ARRIVED':
      return 'Водитель прибыл';
    case 'IN_PROGRESS':
      return 'Вы в пути';
    default:
      return status ?? '';
  }
}
