import { api } from './client';
import { ApiResponse, DriverBalance, Order, TokenPair } from './types';

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

export async function fetchDriverBalance(): Promise<DriverBalance> {
  return {
    availableCents: 125000,
    pendingCents: 25000,
    lifetimeEarnedCents: 450000,
    currency: 'UZS',
  };
}
