import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MapboxTripMap } from '../../src/features/map/MapboxTripMap';
import { useBookingFlow } from '../../src/features/booking/useBookingFlow';
import { estimateRoute } from '../../src/shared/api/customer-api';
import type { AddressSuggestion, RouteEstimate, Tariff } from '../../src/shared/api/types';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { AddressSearchInput } from '../../src/shared/ui/AddressSearchInput';
import { TariffCard } from '../../src/shared/ui/TariffCard';

type EstimateState = {
  estimate: RouteEstimate | null;
  isLoading: boolean;
  error: string | null;
};

const MIN_ROUTE_DISTANCE_KM = 0.05;

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
      ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(
        booking.activeOrder.status,
      ),
  );

  const routeDistanceKm =
    booking.pickup && booking.dropoff ? distanceKm(booking.pickup, booking.dropoff) : null;

  const hasRoutePoints = Boolean(
    booking.pickup?.address.trim() &&
      booking.dropoff?.address.trim() &&
      routeDistanceKm !== null &&
      routeDistanceKm >= MIN_ROUTE_DISTANCE_KM,
  );

  const routeKey = useMemo(() => {
    if (!booking.pickup || !booking.dropoff || !hasRoutePoints) return null;
    return [
      booking.pickup.address.trim(),
      booking.pickup.latitude,
      booking.pickup.longitude,
      booking.dropoff.address.trim(),
      booking.dropoff.latitude,
      booking.dropoff.longitude,
      tariffs.map((t) => t.code).join(','),
    ].join('|');
  }, [booking.dropoff, booking.pickup, hasRoutePoints, tariffs]);

  useEffect(() => {
    void refreshTariffs();
    void useCurrentLocation();
  }, []);

  useEffect(() => {
    if (!routeKey || tariffs.length === 0 || !booking.pickup || !booking.dropoff) {
      setEstimateByTariff({});
      booking.setEstimate(null);
      lastEstimateKey.current = null;
      return;
    }
    if (lastEstimateKey.current === routeKey) return;
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
    if (!booking.pickup || !booking.dropoff || !hasRoutePoints) return;
    setRouteEstimating(true);
    setEstimateByTariff(
      Object.fromEntries(
        nextTariffs.map((t) => [t.code, { estimate: null, isLoading: true, error: null }]),
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
            { estimate: null, isLoading: false, error: 'Ошибка маршрута' },
          ] as const;
        }
      }),
    );
    const nextState = Object.fromEntries(results);
    setEstimateByTariff(nextState);
    setRouteEstimating(false);
    const selected = booking.selectedTariff
      ? nextState[booking.selectedTariff.code]?.estimate
      : null;
    if (selected) {
      booking.setEstimate(selected);
      return;
    }
    const first = nextTariffs.find((t) => nextState[t.code]?.estimate);
    if (first) {
      booking.setTariff(first);
      booking.setEstimate(nextState[first.code].estimate);
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
    if (kind === 'pickup') booking.setPickup(point);
    else booking.setDropoff(point);
  }

  async function useCurrentLocation() {
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Геолокация недоступна', 'Разрешите доступ к геолокации.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      booking.setPickup({
        address: 'Текущее местоположение',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch {
      Alert.alert('Ошибка', 'Не удалось получить текущую позицию.');
    } finally {
      setLocationLoading(false);
    }
  }

  function selectTariff(tariff: Tariff) {
    const state = estimateByTariff[tariff.code];
    if (!state?.estimate) {
      Alert.alert('Тариф недоступен', state?.error ?? 'Маршрут не рассчитан');
      return;
    }
    booking.setTariff(tariff);
    booking.setEstimate(state.estimate);
  }

  async function submitOrder() {
    if (hasActiveTrip) {
      Alert.alert('Активная поездка', 'Завершите текущую поездку.');
      return;
    }
    if (!booking.pickup || !booking.dropoff) {
      Alert.alert('Укажите маршрут', 'Выберите откуда и куда.');
      return;
    }
    if (!hasRoutePoints) {
      Alert.alert('Маршрут слишком короткий', 'Точки слишком близко друг к другу.');
      return;
    }
    if (!booking.selectedTariff || !booking.estimate) {
      Alert.alert('Выберите тариф', 'Дождитесь расчёта маршрута.');
      return;
    }
    try {
      setLoading(true);
      await orderTaxi();
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать заказ.');
    } finally {
      setLoading(false);
    }
  }

  const selectedEstimate = booking.selectedTariff
    ? estimateByTariff[booking.selectedTariff.code]?.estimate
    : null;
  const estimatedDuration =
    selectedEstimate?.durationMinutes ?? booking.estimate?.durationMinutes;
  const canOrder =
    !loading &&
    !routeEstimating &&
    !hasActiveTrip &&
    hasRoutePoints &&
    Boolean(booking.selectedTariff) &&
    Boolean(booking.estimate);

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <MapboxTripMap
          driverLocation={booking.driverLocation}
          dropoff={booking.dropoff}
          pickup={booking.pickup}
        />
      </View>

      <SafeAreaView style={styles.topCard}>
        <View style={styles.addressCard}>
          <View style={styles.addressRow}>
            <View style={styles.dotYellow} />
            <View style={styles.addressInputWrap}>
              <Text style={styles.addressLabel}>Откуда</Text>
              <AddressSearchInput
                inline
                label=""
                onClear={() => booking.setPickup(null)}
                onSelect={(s: AddressSuggestion) => selectAddress('pickup', s)}
                placeholder="Текущее местоположение"
                value={booking.pickup?.address ?? ''}
              />
            </View>
            <TouchableOpacity
              onPress={() => void useCurrentLocation()}
              style={styles.arrowBtn}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.addressRow}>
            <View style={styles.dotBlack} />
            <View style={styles.addressInputWrap}>
              <Text style={styles.addressLabel}>Куда</Text>
              <AddressSearchInput
                inline
                label=""
                onClear={() => booking.setDropoff(null)}
                onSelect={(s: AddressSuggestion) => selectAddress('dropoff', s)}
                placeholder="Куда поедем?"
                value={booking.dropoff?.address ?? ''}
              />
            </View>
            <TouchableOpacity style={styles.plusBtn}>
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        {hasActiveTrip ? (
          <TouchableOpacity
            onPress={() => router.push(`/trip/${booking.activeOrder?.id}`)}
            style={styles.activeTrip}
          >
            <Text style={styles.activeTripText}>У вас активная поездка — открыть →</Text>
          </TouchableOpacity>
        ) : null}

        <FlatList
          data={tariffs}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tariffList}
          renderItem={({ item: tariff }) => {
            const state = estimateByTariff[tariff.code];
            return (
              <TariffCard
                disabled={
                  hasActiveTrip || !hasRoutePoints || state?.isLoading || !state?.estimate
                }
                error={state?.error}
                estimate={state?.estimate}
                loading={state?.isLoading}
                onPress={() => selectTariff(tariff)}
                selected={booking.selectedTariff?.id === tariff.id}
                tariff={tariff}
              />
            );
          }}
        />

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileLabel}>Профиль</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canOrder}
            onPress={() => void submitOrder()}
            style={[styles.orderBtn, !canOrder && styles.orderBtnDisabled]}
          >
            <Text style={styles.orderBtnText}>
              {loading ? 'Создаём заказ...' : 'Заказать'}
            </Text>
            {estimatedDuration ? (
              <Text style={styles.orderBtnSub}>Подача ≈ {estimatedDuration} мин</Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileIcon}>⚙️</Text>
            <Text style={styles.profileLabel}>Параметры</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  map: { ...StyleSheet.absoluteFillObject },
  topCard: {
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
  },
  addressInputWrap: { flex: 1 },
  addressLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 2 },
  dotYellow: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    height: 18,
    width: 18,
  },
  dotBlack: {
    backgroundColor: '#111827',
    borderColor: '#111827',
    borderRadius: 10,
    borderWidth: 3,
    height: 18,
    width: 18,
  },
  divider: {
    backgroundColor: '#f3f4f6',
    height: 1,
    marginLeft: 28,
    marginVertical: 4,
  },
  arrowBtn: { padding: 4 },
  arrowText: { color: '#9ca3af', fontSize: 22, fontWeight: '300' },
  plusBtn: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  plusText: { color: '#374151', fontSize: 20, fontWeight: '300' },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    elevation: 12,
    left: 0,
    paddingBottom: 24,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    height: 4,
    marginBottom: 12,
    marginTop: 10,
    width: 40,
  },
  tariffList: { gap: 10, paddingHorizontal: 16, paddingVertical: 4 },
  activeTrip: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 12,
  },
  activeTripText: { color: '#92400e', fontWeight: '700', textAlign: 'center' },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  profileBtn: { alignItems: 'center', gap: 2, width: 56 },
  profileIcon: { fontSize: 22 },
  profileLabel: { color: '#6b7280', fontSize: 11 },
  orderBtn: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 28,
    flex: 1,
    paddingVertical: 14,
  },
  orderBtnDisabled: { backgroundColor: '#9ca3af' },
  orderBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  orderBtnSub: { color: '#d1d5db', fontSize: 12, marginTop: 2 },
});
