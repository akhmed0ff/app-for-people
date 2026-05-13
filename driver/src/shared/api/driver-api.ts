import { api } from './client';
import { ApiResponse, DriverBalance, DriverTransaction, Order, OrderOffer, TokenPair } from './types';

export async function loginDriver(phone: string): Promise<TokenPair> {
  void phone;
  const response = await api.post<ApiResponse<TokenPair>>('/auth/dev-login', {
    role: 'DRIVER',
  });
  return response.data.data;
}

export async function fetchDriverOrders(): Promise<Order[]> {
  const response = await api.get<ApiResponse<Order[]>>('/orders');
  return response.data.data;
}

export async function fetchCurrentOffer(): Promise<OrderOffer | null> {
  const response = await api.get<ApiResponse<OrderOffer | null>>('/orders/offers/current');
  return normalizeOffer(response.data.data);
}

export async function fetchAvailableOffers(): Promise<OrderOffer[]> {
  const response = await api.get<ApiResponse<OrderOffer[]>>('/orders/available');
  return response.data.data.map(normalizeOffer).filter((offer): offer is OrderOffer => Boolean(offer));
}

export async function acceptOrderOffer(offerId: string): Promise<Order> {
  const response = await api.post<ApiResponse<Order>>(`/orders/offers/${offerId}/accept`);
  return response.data.data;
}

export async function rejectOrderOffer(offerId: string) {
  const response = await api.post<ApiResponse<OrderOffer>>(`/orders/offers/${offerId}/reject`);
  return response.data.data;
}

export async function fetchActiveDriverOrder(): Promise<Order | null> {
  const orders = await fetchDriverOrders();
  return (
    orders.find((order) => !['COMPLETED', 'CANCELED'].includes(order.status)) ?? null
  );
}

export async function fetchDriverBalance(): Promise<DriverBalance> {
  const response = await api.get<ApiResponse<DriverBalance>>('/drivers/me/balance');
  return response.data.data;
}

export async function fetchDriverTransactions(): Promise<DriverTransaction[]> {
  const response = await api.get<ApiResponse<DriverTransaction[]>>('/drivers/me/transactions');
  return response.data.data;
}

export async function registerPushToken(input: {
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
}) {
  const response = await api.post<ApiResponse<{ id: string; token: string; isActive: boolean }>>(
    '/push/register',
    input,
  );
  return response.data.data;
}

export async function unregisterPushToken(token: string) {
  const response = await api.post<ApiResponse<{ token: string; isActive: boolean }>>('/push/unregister', {
    token,
  });
  return response.data.data;
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
      tariff?: { code?: string; name?: string };
    };
    dropoffAddress?: string;
    dropoffLat?: number | string;
    dropoffLng?: number | string;
    tariff?: { code?: string; name?: string };
  };
  if (legacyOffer.order) {
    return {
      ...offer,
      offerId: offer.offerId ?? legacyOffer.id ?? offer.orderId,
      pickupAddress: offer.pickupAddress ?? legacyOffer.order.pickupAddress,
      pickupLat: offer.pickupLat ?? legacyOffer.order.pickupLat,
      pickupLng: offer.pickupLng ?? legacyOffer.order.pickupLng,
      destinationAddress: offer.destinationAddress ?? legacyOffer.order.dropoffAddress,
      destinationLat: offer.destinationLat ?? legacyOffer.order.dropoffLat,
      destinationLng: offer.destinationLng ?? legacyOffer.order.dropoffLng,
      tariffCode: offer.tariffCode ?? legacyOffer.order.tariff?.code ?? legacyOffer.order.tariff?.name,
    };
  }
  return {
    ...offer,
    offerId: offer.offerId ?? legacyOffer.id ?? offer.orderId,
    destinationAddress: offer.destinationAddress ?? legacyOffer.dropoffAddress ?? '',
    destinationLat: offer.destinationLat ?? legacyOffer.dropoffLat ?? 0,
    destinationLng: offer.destinationLng ?? legacyOffer.dropoffLng ?? 0,
    tariffCode: offer.tariffCode ?? legacyOffer.tariff?.code ?? legacyOffer.tariff?.name,
  };
}
