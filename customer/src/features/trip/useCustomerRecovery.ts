import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Order } from '../../shared/api/types';
import { fetchCurrentUser } from '../../shared/api/customer-api';
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
  const recoverActiveTrip = useBookingStore((state) => state.recoverActiveTrip);
  const syncActiveOrder = useBookingStore((state) => state.syncActiveOrder);
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
    async function recover() {
      setRecovering(true);
      try {
        await fetchCurrentUser().catch(() => null);
        const order = await recoverActiveTrip();
        if (cancelled) {
          return;
        }
        if (order) {
          getTaxiSocket(accessToken).emit('order.join', { orderId: order.id });
          router.replace(`/trip/${order.id}`);
        }
      } finally {
        if (!cancelled) {
          setRecovering(false);
        }
      }
    }

    void recover();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, recoverActiveTrip, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getTaxiSocket(token);
    function handleOrder(order: Order) {
      const current = useBookingStore.getState().activeOrder;
      if (current && current.id !== order.id) {
        return;
      }
      const key = `${order.id}:${order.status}:${order.updatedAt ?? ''}`;
      if (lastEventKey.current === key) {
        return;
      }
      lastEventKey.current = key;
      useBookingStore.getState().setActiveOrder(order);
    }

    function joinActiveOrder() {
      const order = useBookingStore.getState().activeOrder;
      if (order) {
        socket.emit('order.join', { orderId: order.id });
      }
    }

    socket.on('order.accepted', handleOrder);
    socket.on('order:accepted', handleOrder);
    socket.on('order.status.updated', handleOrder);
    socket.on('order.canceled', handleOrder);
    socket.on('order:canceled', handleOrder);
    socket.on('connect', joinActiveOrder);
    if (socket.connected) {
      joinActiveOrder();
    }

    return () => {
      socket.off('order.accepted', handleOrder);
      socket.off('order:accepted', handleOrder);
      socket.off('order.status.updated', handleOrder);
      socket.off('order.canceled', handleOrder);
      socket.off('order:canceled', handleOrder);
      socket.off('connect', joinActiveOrder);
    };
  }, [token]);

  useEffect(() => {
    if (!token || !activeOrder || connectionStatus === 'connected') {
      return;
    }

    const timer = setInterval(() => {
      void syncActiveOrder();
    }, POLLING_MS);

    return () => clearInterval(timer);
  }, [activeOrder, connectionStatus, syncActiveOrder, token]);

  return { recovering };
}
