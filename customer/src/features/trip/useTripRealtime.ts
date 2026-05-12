import { useEffect, useState } from 'react';
import { Order } from '../../shared/api/types';
import { getTaxiSocket } from '../../shared/socket/taxi-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useBookingStore } from '../../shared/store/booking.store';

export function useTripRealtime(orderId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const booking = useBookingStore();
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getTaxiSocket(token);

    function handleOrder(order: Order) {
      if (order.id === orderId) {
        booking.setActiveOrder(order);
      }
    }

    socket.on('order.accepted', handleOrder);
    socket.on('order.status.updated', handleOrder);
    socket.on('order.canceled', handleOrder);
    function handleDriverLocation(location: Parameters<typeof booking.setDriverLocation>[0]) {
      booking.setDriverLocation(location);
      if (location && booking.dropoff) {
        socket.emit('eta.request', {
          orderId,
          driverLat: location.latitude,
          driverLng: location.longitude,
          destinationLat: booking.dropoff.latitude,
          destinationLng: booking.dropoff.longitude,
        });
      }
    }

    function handleEta(eta: { orderId: string; etaSeconds: number }) {
      if (eta.orderId === orderId) {
        setEtaSeconds(eta.etaSeconds);
      }
    }

    socket.on('driver.location.updated', handleDriverLocation);
    socket.on('eta.updated', handleEta);

    socket.emit('heartbeat');

    return () => {
      socket.off('order.accepted', handleOrder);
      socket.off('order.status.updated', handleOrder);
      socket.off('order.canceled', handleOrder);
      socket.off('driver.location.updated', handleDriverLocation);
      socket.off('eta.updated', handleEta);
    };
  }, [booking, orderId, token]);

  return { etaSeconds };
}
