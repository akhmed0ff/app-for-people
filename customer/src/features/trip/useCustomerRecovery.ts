import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { fetchActiveOrder } from '../../shared/api/customer-api';
import { getTaxiSocket } from '../../shared/socket/taxi-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useBookingStore } from '../../shared/store/booking.store';
import { useConnectionStore } from '../../shared/store/connection.store';

const POLLING_MS = 7000;

export function useCustomerRecovery() {
  const token = useAuthStore((state) => state.accessToken);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const activeOrder = useBookingStore((state) => state.activeOrder);
  const hydrateActiveOrder = useBookingStore((state) => state.hydrateActiveOrder);
  const setActiveOrder = useBookingStore((state) => state.setActiveOrder);
  const connectionStatus = useConnectionStore((state) => state.status);
  const [recovering, setRecovering] = useState(false);
  const lastEventKey = useRef<string | null>(null);

  useEffect(() => {
    void hydrateActiveOrder();
  }, [hydrateActiveOrder]);

  useEffect(() => {
    if (!authHydrated || !token) {
      return;
    }

    const accessToken = token;
    let cancelled = false;
    async function syncActiveOrder() {
      setRecovering(true);
      try {
        const order = await fetchActiveOrder();
        if (cancelled) {
          return;
        }
        setActiveOrder(order);
        if (order) {
          getTaxiSocket(accessToken).emit('order.join', { orderId: order.id });
          router.replace(`/trip/${order.id}`);
        }
      } catch {
        // The connection banner reflects the network state; keep stale local order visible.
      } finally {
        if (!cancelled) {
          setRecovering(false);
        }
      }
    }

    void syncActiveOrder();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, setActiveOrder, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getTaxiSocket(token);
    function handleOrder(order: NonNullable<typeof activeOrder>) {
      const key = `${order.id}:${order.status}:${order.updatedAt ?? ''}`;
      if (lastEventKey.current === key) {
        return;
      }
      lastEventKey.current = key;
      setActiveOrder(order);
    }

    socket.on('order.accepted', handleOrder);
    socket.on('order.status.updated', handleOrder);
    socket.on('order.canceled', handleOrder);
    function joinActiveOrder() {
      const order = useBookingStore.getState().activeOrder;
      if (order) {
        socket.emit('order.join', { orderId: order.id });
      }
    }

    socket.on('connect', joinActiveOrder);
    if (socket.connected) {
      joinActiveOrder();
    }

    return () => {
      socket.off('order.accepted', handleOrder);
      socket.off('order.status.updated', handleOrder);
      socket.off('order.canceled', handleOrder);
      socket.off('connect', joinActiveOrder);
    };
  }, [setActiveOrder, token]);

  useEffect(() => {
    if (!token || !activeOrder || connectionStatus === 'connected') {
      return;
    }

    const timer = setInterval(async () => {
      try {
        setActiveOrder(await fetchActiveOrder());
      } catch {
        // Keep polling until the network/backend is available again.
      }
    }, POLLING_MS);

    return () => clearInterval(timer);
  }, [activeOrder, connectionStatus, setActiveOrder, token]);

  return { recovering };
}
