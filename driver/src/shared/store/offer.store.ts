import axios from 'axios';
import { create } from 'zustand';
import {
  acceptOrderOffer,
  fetchCurrentOffer as fetchCurrentOfferApi,
  rejectOrderOffer,
} from '../api/driver-api';
import { OrderOffer } from '../api/types';
import { useOrdersStore } from './orders.store';

type OfferState = {
  currentOffer: OrderOffer | null;
  expiresAt: string | null;
  secondsLeft: number;
  isLoading: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  error: string | null;
  notice: string | null;
  setOffer: (offer: OrderOffer | null) => void;
  clearOffer: (notice?: string) => void;
  fetchCurrentOffer: () => Promise<void>;
  acceptOffer: () => Promise<{ ok: boolean; orderId?: string }>;
  rejectOffer: () => Promise<boolean>;
  startCountdown: () => void;
  stopCountdown: () => void;
  markExpired: () => void;
};

let countdownTimer: ReturnType<typeof setInterval> | null = null;

export const useOfferStore = create<OfferState>((set, get) => ({
  currentOffer: null,
  expiresAt: null,
  secondsLeft: 0,
  isLoading: false,
  isAccepting: false,
  isRejecting: false,
  error: null,
  notice: null,
  setOffer: (offer) => {
    if (!offer) {
      get().clearOffer();
      return;
    }
    const secondsLeft = getSecondsLeft(offer.expiresAt);
    if (secondsLeft <= 0) {
      get().clearOffer('Время предложения истекло');
      return;
    }
    set({
      currentOffer: offer,
      expiresAt: offer.expiresAt,
      secondsLeft,
      error: null,
      notice: null,
    });
    get().startCountdown();
  },
  clearOffer: (notice) => {
    get().stopCountdown();
    set({
      currentOffer: null,
      expiresAt: null,
      secondsLeft: 0,
      isAccepting: false,
      isRejecting: false,
      error: null,
      notice: notice ?? null,
    });
  },
  fetchCurrentOffer: async () => {
    set({ isLoading: true, error: null });
    try {
      const offer = normalizeOffer(await fetchCurrentOfferApi());
      get().setOffer(offer);
    } catch {
      set({ error: 'Не удалось загрузить предложение заказа' });
    } finally {
      set({ isLoading: false });
    }
  },
  acceptOffer: async () => {
    const offer = get().currentOffer;
    if (!offer) {
      return { ok: false };
    }
    set({ isAccepting: true, error: null });
    try {
      const order = await acceptOrderOffer(offer.offerId);
      useOrdersStore.getState().setActiveOrder(order);
      get().clearOffer();
      return { ok: true, orderId: order.id };
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 409) {
        get().clearOffer('Заказ уже недоступен');
        return { ok: false };
      }
      if (status === 403) {
        set({ error: 'Это предложение недоступно для вашего аккаунта' });
        return { ok: false };
      }
      set({ error: 'Нет связи с сервером. Попробуйте еще раз.' });
      return { ok: false };
    } finally {
      set({ isAccepting: false });
    }
  },
  rejectOffer: async () => {
    const offer = get().currentOffer;
    if (!offer) {
      return false;
    }
    set({ isRejecting: true, error: null });
    try {
      await rejectOrderOffer(offer.offerId);
      get().clearOffer('Заказ отклонен');
      return true;
    } catch {
      set({ error: 'Не удалось отклонить заказ' });
      return false;
    } finally {
      set({ isRejecting: false });
    }
  },
  startCountdown: () => {
    get().stopCountdown();
    countdownTimer = setInterval(() => {
      const expiresAt = get().expiresAt;
      if (!expiresAt) {
        return;
      }
      const secondsLeft = getSecondsLeft(expiresAt);
      if (secondsLeft <= 0) {
        get().markExpired();
        return;
      }
      set({ secondsLeft });
    }, 1000);
  },
  stopCountdown: () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  },
  markExpired: () => {
    get().clearOffer('Время предложения истекло');
  },
}));

function getSecondsLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function normalizeOffer(offer: OrderOffer | null): OrderOffer | null {
  if (!offer) {
    return null;
  }
  const legacyOffer = offer as OrderOffer & {
    id?: string;
    order?: {
      pickupAddress: string;
      pickupLat: number | string;
      pickupLng: number | string;
      dropoffAddress: string;
      dropoffLat: number | string;
      dropoffLng: number | string;
      distanceMeters?: number;
      distanceKm?: number;
      routeDurationMinutes?: number | null;
      routeGeometry?: string | null;
      fareCents?: number;
      estimatedPrice?: number;
      tariff?: { code?: string; name?: string };
    };
  };
  if (!legacyOffer.order) {
    return offer;
  }
  return {
    ...offer,
    offerId: offer.offerId ?? legacyOffer.id ?? offer.orderId,
    orderId: offer.orderId,
    pickupAddress: offer.pickupAddress ?? legacyOffer.order.pickupAddress,
    pickupLat: offer.pickupLat ?? legacyOffer.order.pickupLat,
    pickupLng: offer.pickupLng ?? legacyOffer.order.pickupLng,
    destinationAddress: offer.destinationAddress ?? legacyOffer.order.dropoffAddress,
    destinationLat: offer.destinationLat ?? legacyOffer.order.dropoffLat,
    destinationLng: offer.destinationLng ?? legacyOffer.order.dropoffLng,
    tariffCode: offer.tariffCode ?? legacyOffer.order.tariff?.code ?? legacyOffer.order.tariff?.name,
    distanceKm: offer.distanceKm ?? getDistanceKm(legacyOffer.order),
    routeDurationMinutes: offer.routeDurationMinutes ?? legacyOffer.order.routeDurationMinutes,
    routeGeometry: offer.routeGeometry ?? legacyOffer.order.routeGeometry,
    estimatedPrice: offer.estimatedPrice ?? legacyOffer.order.estimatedPrice ?? legacyOffer.order.fareCents,
  };
}

function getDistanceKm(order: { distanceKm?: number; distanceMeters?: number }) {
  if (typeof order.distanceKm === 'number') {
    return order.distanceKm;
  }
  if (typeof order.distanceMeters === 'number') {
    return Number((order.distanceMeters / 1000).toFixed(1));
  }
  return undefined;
}
