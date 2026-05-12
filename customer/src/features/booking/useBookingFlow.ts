import { router } from 'expo-router';
import { Alert } from 'react-native';
import {
  createOrder,
  estimatePrice,
  fetchPassengerProfile,
  fetchTariffs,
} from '../../shared/api/customer-api';
import { Tariff } from '../../shared/api/types';
import { useAuthStore } from '../../shared/store/auth.store';
import { useBookingStore } from '../../shared/store/booking.store';
import { getTaxiSocket } from '../../shared/socket/taxi-socket';
import { estimateDistanceMeters } from '../../shared/utils/pricing';

export function useBookingFlow() {
  const auth = useAuthStore();
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
    const distanceMeters = estimateDistanceMeters(booking.pickup, booking.dropoff);
    const estimate = await estimatePrice({
      tariffCode: tariff.code,
      distanceMeters,
      waitingSeconds: 0,
      stopsCount: 0,
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
    const order = await createOrder({
      tariffId: booking.selectedTariff.id,
      pickupAddress: booking.pickup.address,
      pickupLat: booking.pickup.latitude,
      pickupLng: booking.pickup.longitude,
      dropoffAddress: booking.dropoff.address,
      dropoffLat: booking.dropoff.latitude,
      dropoffLng: booking.dropoff.longitude,
    });
    booking.setActiveOrder(order);

    if (auth.accessToken) {
      getTaxiSocket(auth.accessToken).emit('order.dispatch', {
        orderId: order.id,
        radiusMeters: 5000,
        limit: 8,
      });
    }

    router.push(`/trip/${order.id}`);
  }

  return { loadTariffs, calculate, orderTaxi };
}
