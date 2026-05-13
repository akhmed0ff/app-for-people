import { router } from 'expo-router';
import { Alert } from 'react-native';
import {
  estimateRoute,
  fetchPassengerProfile,
  fetchTariffs,
} from '../../shared/api/customer-api';
import { Tariff } from '../../shared/api/types';
import { useBookingStore } from '../../shared/store/booking.store';

export function useBookingFlow() {
  const booking = useBookingStore();

  async function loadTariffs() {
    const tariffs = await fetchTariffs();
    if (!booking.selectedTariff && tariffs[0]) {
      booking.setTariff(tariffs[0]);
    }
    return tariffs;
  }

  async function calculate(tariff: Tariff) {
    if (!booking.pickup || !booking.dropoff) {
      return null;
    }
    const estimate = await estimateRoute({
      tariffCode: tariff.code,
      pickupLat: booking.pickup.latitude,
      pickupLng: booking.pickup.longitude,
      destinationLat: booking.dropoff.latitude,
      destinationLng: booking.dropoff.longitude,
    });
    booking.setEstimate(estimate);
    return estimate;
  }

  async function orderTaxi() {
    if (!booking.pickup || !booking.dropoff || !booking.selectedTariff) {
      Alert.alert('Маршрут не готов', 'Выберите точки А и Б и тариф.');
      return;
    }

    await fetchPassengerProfile();
    const order = await booking.createOrder({
      tariffCode: booking.selectedTariff.code,
      pickupAddress: booking.pickup.address,
      pickupLat: booking.pickup.latitude,
      pickupLng: booking.pickup.longitude,
      destinationAddress: booking.dropoff.address,
      destinationLat: booking.dropoff.latitude,
      destinationLng: booking.dropoff.longitude,
    });
    router.push(`/trip/${order.id}`);
  }

  return { loadTariffs, calculate, orderTaxi };
}
