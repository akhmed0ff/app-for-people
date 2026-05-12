import { router } from 'expo-router';
import { useCallback } from 'react';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useDriverStore } from '../../shared/store/driver.store';
import { useOrdersStore } from '../../shared/store/orders.store';
import { OrderStatus } from '../../shared/api/types';

export function useTripControls(orderId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const location = useDriverStore((state) => state.location);
  const activeOrder = useOrdersStore((state) => state.activeOrder);

  const updateStatus = useCallback((status: OrderStatus) => {
    if (!token) {
      return;
    }
    getDriverSocket(token).emit('order.status.update', { orderId, status });
  }, [orderId, token]);

  const cancel = useCallback(() => {
    if (!token) {
      return;
    }
    getDriverSocket(token).emit('order.cancel', { orderId, reason: 'Driver canceled from app.' });
    router.replace('/(tabs)');
  }, [orderId, token]);

  const requestEta = useCallback(() => {
    if (!token || !location || !activeOrder) {
      return;
    }
    getDriverSocket(token).emit('eta.request', {
      orderId,
      driverLat: location.latitude,
      driverLng: location.longitude,
      destinationLat: Number(activeOrder.pickupLat),
      destinationLng: Number(activeOrder.pickupLng),
    });
  }, [activeOrder, location, orderId, token]);

  return { activeOrder, updateStatus, cancel, requestEta };
}
