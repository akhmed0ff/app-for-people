import { api } from './client';
import { ApiResponse, Order, RouteEstimate, Tariff, TokenPair } from './types';

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

export async function fetchCurrentUser(): Promise<{ id: string; role: string }> {
  const response = await api.get<ApiResponse<{ id: string; role: string }>>('/auth/me');
  return response.data.data;
}

export async function estimateRoute(input: {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  tariffCode: string;
}): Promise<RouteEstimate> {
  const response = await api.post<ApiResponse<RouteEstimate>>('/routing/estimate', input);
  return response.data.data;
}

export async function createOrder(input: {
  tariffCode: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
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

export async function fetchMyOrders(): Promise<Order[]> {
  try {
    const response = await api.get<ApiResponse<Order[]>>('/orders/my');
    return response.data.data;
  } catch {
    return fetchOrders();
  }
}

export async function fetchActiveOrder(): Promise<Order | null> {
  const orders = await fetchMyOrders();
  return (
    orders.find((order) => !['COMPLETED', 'CANCELED'].includes(order.status)) ?? null
  );
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
