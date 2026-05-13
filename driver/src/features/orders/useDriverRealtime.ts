import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { fetchActiveDriverOrder } from '../../shared/api/driver-api';
import { Order, OrderOffer } from '../../shared/api/types';
import { getDriverSocket } from '../../shared/socket/driver-socket';
import { useAuthStore } from '../../shared/store/auth.store';
import { useDriverStore } from '../../shared/store/driver.store';
import { useOfferStore } from '../../shared/store/offer.store';
import { useOrdersStore } from '../../shared/store/orders.store';
import { startDriverTracking, stopDriverTracking } from '../location/driver-location.service';

export function useDriverRealtime() {
  const token = useAuthStore((state) => state.accessToken);
  const { online, location, setOnline } = useDriverStore();
  const currentOffer = useOfferStore((state) => state.currentOffer);
  const setOffer = useOfferStore((state) => state.setOffer);
  const clearOffer = useOfferStore((state) => state.clearOffer);
  const fetchCurrentOffer = useOfferStore((state) => state.fetchCurrentOffer);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const [connecting, setConnecting] = useState(false);
  const lastEventKey = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getDriverSocket(token);
    function applyOrder(order: Order) {
      const key = `${order.id}:${order.status}:${order.updatedAt ?? ''}`;
      if (lastEventKey.current === key) {
        return;
      }
      lastEventKey.current = key;
      setActiveOrder(order);
    }

    function handleOffer(offer: OrderOffer) {
      setOffer(normalizeSocketOffer(offer));
      router.push('/(tabs)');
    }

    function handleOfferExpired(payload: { offerId: string }) {
      if (useOfferStore.getState().currentOffer?.offerId === payload.offerId) {
        clearOffer('Предложение истекло');
      }
    }

    function handleOfferCanceled(payload: { offerId: string }) {
      if (useOfferStore.getState().currentOffer?.offerId === payload.offerId) {
        clearOffer('Предложение отменено');
      }
    }

    function handleOfferRejected(payload: { offerId: string }) {
      if (useOfferStore.getState().currentOffer?.offerId === payload.offerId) {
        clearOffer('Заказ отклонен');
      }
    }

    async function handleOfferAccepted(payload: { offerId: string; orderId: string }) {
      if (useOfferStore.getState().currentOffer?.offerId === payload.offerId) {
        clearOffer();
      }
      const order = await fetchActiveDriverOrder().catch(() => null);
      if (order) {
        applyOrder(order);
      }
      router.push(`/trip/${payload.orderId}`);
    }

    function handleAccepted(order: Order) {
      clearOffer();
      applyOrder(order);
      router.push(`/trip/${order.id}`);
    }

    socket.on('order:offer:new', handleOffer);
    socket.on('order.offered', handleOffer);
    socket.on('order:offer:expired', handleOfferExpired);
    socket.on('order:offer:canceled', handleOfferCanceled);
    socket.on('order:offer:accepted', handleOfferAccepted);
    socket.on('order:offer:rejected', handleOfferRejected);
    socket.on('order.accepted', handleAccepted);
    socket.on('order.status.updated', applyOrder);
    socket.on('order.canceled', applyOrder);

    return () => {
      socket.off('order:offer:new', handleOffer);
      socket.off('order.offered', handleOffer);
      socket.off('order:offer:expired', handleOfferExpired);
      socket.off('order:offer:canceled', handleOfferCanceled);
      socket.off('order:offer:accepted', handleOfferAccepted);
      socket.off('order:offer:rejected', handleOfferRejected);
      socket.off('order.accepted', handleAccepted);
      socket.off('order.status.updated', applyOrder);
      socket.off('order.canceled', applyOrder);
    };
  }, [clearOffer, setActiveOrder, setOffer, token]);

  async function goOnline() {
    if (!token) {
      return;
    }
    setConnecting(true);
    const trackingStarted = await startDriverTracking();
    if (trackingStarted) {
      setOnline(true);
      getDriverSocket(token).emit('driver.online', location ?? undefined);
      void fetchCurrentOffer();
    }
    setConnecting(false);
  }

  async function goOffline() {
    if (!token) {
      return;
    }
    getDriverSocket(token).emit('driver.offline');
    clearOffer();
    setOnline(false);
    await stopDriverTracking();
  }

  return { online, connecting, currentOffer, activeOrder, goOnline, goOffline };
}

function normalizeSocketOffer(offer: OrderOffer): OrderOffer {
  const legacyOffer = offer as OrderOffer & {
    id?: string;
    dropoffAddress?: string;
    dropoffLat?: number | string;
    dropoffLng?: number | string;
    tariff?: { code?: string; name?: string };
  };
  return {
    ...offer,
    offerId: offer.offerId ?? legacyOffer.id ?? offer.orderId,
    destinationAddress: offer.destinationAddress ?? legacyOffer.dropoffAddress ?? '',
    destinationLat: offer.destinationLat ?? legacyOffer.dropoffLat ?? 0,
    destinationLng: offer.destinationLng ?? legacyOffer.dropoffLng ?? 0,
    tariffCode: offer.tariffCode ?? legacyOffer.tariff?.code ?? legacyOffer.tariff?.name,
  };
}
