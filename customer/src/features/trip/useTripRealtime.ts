import { useEffect, useRef, useState } from 'react';
import { DriverLocation, Order } from '../../shared/api/types';
import { getTaxiSocket } from '../../shared/socket/taxi-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useBookingStore } from '../../shared/store/booking.store';
import { useConnectionStore } from '../../shared/store/connection.store';

const POLLING_MS = 7000;

export function useTripRealtime(orderId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const connectionStatus = useConnectionStore((state) => state.status);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const lastOrderEventKey = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getTaxiSocket(token);

    function shouldHandle(order: Order) {
      const current = useBookingStore.getState().activeOrder;
      if (order.id !== orderId || (current && current.id !== order.id)) {
        return false;
      }
      const key = `${order.id}:${order.status}:${order.updatedAt ?? ''}`;
      if (lastOrderEventKey.current === key) {
        return false;
      }
      lastOrderEventKey.current = key;
      return true;
    }

    function handleOrder(order: Order) {
      if (!shouldHandle(order)) {
        return;
      }
      const store = useBookingStore.getState();
      switch (order.status) {
        case 'DRIVER_ASSIGNED':
          store.handleOrderAccepted(order);
          break;
        case 'DRIVER_ARRIVED':
          store.handleDriverArrived(order);
          break;
        case 'IN_PROGRESS':
          store.handleOrderStarted(order);
          break;
        case 'COMPLETED':
          store.handleOrderCompleted(order);
          break;
        case 'CANCELED':
          store.handleOrderCanceled(order);
          break;
        default:
          store.setActiveOrder(order);
      }
    }

    function handleMatchingStarted(payload: { orderId: string }) {
      if (payload.orderId === orderId) {
        useBookingStore.setState({ tripState: 'SEARCHING_DRIVER', error: null });
      }
    }

    function handleNoDrivers(payload: { orderId: string }) {
      if (payload.orderId === orderId) {
        useBookingStore.getState().handleNoDriversAvailable();
      }
    }

    function onDriverLocation(location: DriverLocation) {
      const store = useBookingStore.getState();
      store.setDriverLocation(location);
      if (store.dropoff) {
        socket.emit('eta.request', {
          orderId,
          driverLat: location.latitude,
          driverLng: location.longitude,
          destinationLat: store.dropoff.latitude,
          destinationLng: store.dropoff.longitude,
        });
      }
    }

    function handleEta(eta: { orderId: string; etaSeconds: number }) {
      if (eta.orderId === orderId) {
        setEtaSeconds(eta.etaSeconds);
      }
    }

    socket.emit('order.join', { orderId });
    socket.on('order:matching_started', handleMatchingStarted);
    socket.on('order:no_drivers_available', handleNoDrivers);
    socket.on('order.accepted', handleOrder);
    socket.on('order:accepted', handleOrder);
    socket.on('order.status.updated', handleOrder);
    socket.on('order:driver_arrived', handleOrder);
    socket.on('order:started', handleOrder);
    socket.on('order:completed', handleOrder);
    socket.on('order.canceled', handleOrder);
    socket.on('order:canceled', handleOrder);
    socket.on('driver.location.updated', onDriverLocation);
    socket.on('eta.updated', handleEta);
    socket.emit('heartbeat');

    return () => {
      socket.off('order:matching_started', handleMatchingStarted);
      socket.off('order:no_drivers_available', handleNoDrivers);
      socket.off('order.accepted', handleOrder);
      socket.off('order:accepted', handleOrder);
      socket.off('order.status.updated', handleOrder);
      socket.off('order:driver_arrived', handleOrder);
      socket.off('order:started', handleOrder);
      socket.off('order:completed', handleOrder);
      socket.off('order.canceled', handleOrder);
      socket.off('order:canceled', handleOrder);
      socket.off('driver.location.updated', onDriverLocation);
      socket.off('eta.updated', handleEta);
    };
  }, [orderId, token]);

  useEffect(() => {
    if (!token || connectionStatus === 'connected') {
      return;
    }

    const timer = setInterval(() => {
      void useBookingStore.getState().syncActiveOrder();
    }, POLLING_MS);

    return () => clearInterval(timer);
  }, [connectionStatus, token]);

  return { etaSeconds };
}
