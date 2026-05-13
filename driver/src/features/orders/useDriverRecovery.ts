import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { fetchActiveDriverOrder } from '../../shared/api/driver-api';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useConnectionStore } from '../../shared/store/connection.store';
import { useDriverStore } from '../../shared/store/driver.store';
import { useOfferStore } from '../../shared/store/offer.store';
import { useOrdersStore } from '../../shared/store/orders.store';

const POLLING_MS = 7000;

export function useDriverRecovery() {
  const token = useAuthStore((state) => state.accessToken);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const hydrateActiveOrder = useOrdersStore((state) => state.hydrateActiveOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const online = useDriverStore((state) => state.online);
  const location = useDriverStore((state) => state.location);
  const fetchCurrentOffer = useOfferStore((state) => state.fetchCurrentOffer);
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
        const order = await fetchActiveDriverOrder();
        if (cancelled) {
          return;
        }
        setActiveOrder(order);
        if (order) {
          getDriverSocket(accessToken).emit('order.join', { orderId: order.id });
          router.replace(`/trip/${order.id}`);
        } else if (online) {
          getDriverSocket(accessToken).emit('driver.online', location ?? undefined);
          await fetchCurrentOffer();
        }
      } catch {
        // Keep local trip visible; polling/socket reconnect will retry.
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
  }, [authHydrated, fetchCurrentOffer, location, online, setActiveOrder, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getDriverSocket(token);
    function handleOrder(order: NonNullable<typeof activeOrder>) {
      const key = `${order.id}:${order.status}:${order.updatedAt ?? ''}`;
      if (lastEventKey.current === key) {
        return;
      }
      lastEventKey.current = key;
      setActiveOrder(order);
    }

    function restoreSocketState() {
      const order = useOrdersStore.getState().activeOrder;
      if (order) {
        socket.emit('order.join', { orderId: order.id });
      }
      if (online) {
        socket.emit('driver.online', location ?? undefined);
        void fetchCurrentOffer();
      }
    }

    socket.on('order.accepted', handleOrder);
    socket.on('order.status.updated', handleOrder);
    socket.on('order.canceled', handleOrder);
    socket.on('connect', restoreSocketState);
    if (socket.connected) {
      restoreSocketState();
    }

    return () => {
      socket.off('order.accepted', handleOrder);
      socket.off('order.status.updated', handleOrder);
      socket.off('order.canceled', handleOrder);
      socket.off('connect', restoreSocketState);
    };
  }, [fetchCurrentOffer, location, online, setActiveOrder, token]);

  useEffect(() => {
    if (!token || !activeOrder || connectionStatus === 'connected') {
      return;
    }

    const timer = setInterval(async () => {
      try {
        setActiveOrder(await fetchActiveDriverOrder());
      } catch {
        // Keep polling until the network/backend is available again.
      }
    }, POLLING_MS);

    return () => clearInterval(timer);
  }, [activeOrder, connectionStatus, setActiveOrder, token]);

  return { recovering };
}
