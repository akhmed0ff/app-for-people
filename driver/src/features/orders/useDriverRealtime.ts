import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Order } from '../../shared/api/types';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useDriverStore } from '../../shared/store/driver.store';
import { useOrdersStore } from '../../shared/store/orders.store';
import { startDriverTracking, stopDriverTracking } from '../location/driver-location.service';

export function useDriverRealtime() {
  const token = useAuthStore((state) => state.accessToken);
  const { online, location, setOnline } = useDriverStore();
  const queue = useOrdersStore((state) => state.queue);
  const enqueue = useOrdersStore((state) => state.enqueue);
  const removeOffer = useOrdersStore((state) => state.removeOffer);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getDriverSocket(token);
    function handleAccepted(order: Order) {
      removeOffer(order.id);
      setActiveOrder(order);
      router.push(`/trip/${order.id}`);
    }

    function handleCanceled(order: Order) {
      removeOffer(order.id);
      setActiveOrder(order);
    }

    socket.on('order.offered', enqueue);
    socket.on('order.accepted', handleAccepted);
    socket.on('order.status.updated', setActiveOrder);
    socket.on('order.canceled', handleCanceled);

    return () => {
      socket.off('order.offered', enqueue);
      socket.off('order.accepted', handleAccepted);
      socket.off('order.status.updated', setActiveOrder);
      socket.off('order.canceled', handleCanceled);
    };
  }, [enqueue, removeOffer, setActiveOrder, token]);

  async function goOnline() {
    if (!token) {
      return;
    }
    setConnecting(true);
    const trackingStarted = await startDriverTracking();
    if (trackingStarted) {
      setOnline(true);
      getDriverSocket(token).emit('driver.online', location ?? undefined);
    }
    setConnecting(false);
  }

  async function goOffline() {
    if (!token) {
      return;
    }
    getDriverSocket(token).emit('driver.offline');
    setOnline(false);
    await stopDriverTracking();
  }

  function acceptOrder(orderId: string) {
    if (!token) {
      return;
    }
    getDriverSocket(token).emit('order.accept', { orderId });
  }

  return { online, connecting, queue, goOnline, goOffline, acceptOrder };
}
