import { api } from './client';
import { ApiResponse, Order, PriceEstimate, Tariff, TokenPair } from './types';

export async function devPassengerLogin(): Promise<TokenPair> {
  const response = await api.post<ApiResponse<TokenPair>>('/auth/dev-login', {
    role: 'PASSENGER',
  });
  return response.data.data;
}

export async function loginByPhone(phone: string): Promise<TokenPair> {
  void phone;
  const response = await api.post<ApiResponse<TokenPair>>('/auth/dev-login', {
    role: 'PASSENGER',
  });
  return response.data.data;
}

export async function fetchTariffs(): Promise<Tariff[]> {
  const response = await api.get<ApiResponse<Tariff[]>>('/tariffs');
  return response.data.data;
}

export async function fetchPassengerProfile(): Promise<{ id: string }> {
  const response = await api.get<ApiResponse<{ id: string }>>('/passengers/me');
  return response.data.data;
}

export async function estimatePrice(input: {
  tariffCode: string;
  distanceMeters: number;
  waitingSeconds: number;
  stopsCount?: number;
}): Promise<PriceEstimate> {
  const response = await api.post<ApiResponse<PriceEstimate>>('/pricing/estimate', input);
  return response.data.data;
}

export async function createOrder(input: {
  tariffId?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
}): Promise<Order> {
  const response = await api.post<ApiResponse<Order>>('/orders', {
    ...input,
    paymentMethod: 'CASH',
  });
  return response.data.data;
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await api.get<ApiResponse<Order[]>>('/orders');
  return response.data.data;
}
