import { api } from './client';
import { ApiResponse, Driver, Order, OrderOffer, Passenger, Payment, Tariff, TokenPair, User } from './types';

export async function loginAdmin(): Promise<TokenPair> {
  const response = await api.post<ApiResponse<TokenPair>>('/auth/dev-login', { role: 'ADMIN' });
  return response.data.data;
}

export async function fetchDashboard() {
  const response = await api.get<ApiResponse<Record<string, number>>>('/admin/dashboard');
  return response.data.data;
}

export async function fetchDrivers(): Promise<Driver[]> {
  const response = await api.get<ApiResponse<Driver[]>>('/drivers');
  return response.data.data;
}

export async function fetchPassengers(): Promise<Passenger[]> {
  const response = await api.get<ApiResponse<Passenger[]>>('/passengers');
  return response.data.data;
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await api.get<ApiResponse<Order[]>>('/orders');
  return response.data.data;
}

export async function fetchAdminOrders(): Promise<Order[]> {
  try {
    const response = await api.get<ApiResponse<Order[]>>('/admin/orders');
    return response.data.data;
  } catch {
    return fetchOrders();
  }
}

export async function fetchAdminOrder(id: string): Promise<Order | null> {
  try {
    const response = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return response.data.data;
  } catch {
    const orders = await fetchAdminOrders();
    return orders.find((order) => order.id === id) ?? null;
  }
}

export async function fetchOrderOffers(orderId: string): Promise<OrderOffer[] | null> {
  try {
    const response = await api.get<ApiResponse<OrderOffer[]>>(`/admin/orders/${orderId}/offers`);
    return response.data.data;
  } catch {
    return null;
  }
}

export async function fetchUsers(): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>('/users');
  return response.data.data;
}

export async function fetchTariffs(): Promise<Tariff[]> {
  const response = await api.get<ApiResponse<Tariff[]>>('/tariffs');
  return response.data.data;
}

export async function createTariff(input: Omit<Tariff, 'id' | 'isActive'>): Promise<Tariff> {
  const response = await api.post<ApiResponse<Tariff>>('/tariffs', input);
  return response.data.data;
}

export async function updateTariff(id: string, input: Partial<Tariff>): Promise<Tariff> {
  const response = await api.patch<ApiResponse<Tariff>>(`/tariffs/${id}`, input);
  return response.data.data;
}

export async function fetchPayments(): Promise<Payment[]> {
  const response = await api.get<ApiResponse<Payment[]>>('/payments');
  return response.data.data;
}

export async function topUpDriver(driverId: string, input: { amount: number; description?: string }) {
  const response = await api.post<ApiResponse<{ driver: Driver; transaction: Payment }>>(
    `/admin/drivers/${driverId}/top-up`,
    input,
  );
  return response.data.data;
}

export async function adjustDriverBalance(driverId: string, input: { amount: number; description?: string }) {
  const response = await api.post<ApiResponse<{ driver: Driver; transaction: Payment }>>(
    `/admin/drivers/${driverId}/adjust`,
    input,
  );
  return response.data.data;
}

export async function fetchDriverTransactions(driverId: string): Promise<Payment[]> {
  const response = await api.get<ApiResponse<Payment[]>>(`/admin/drivers/${driverId}/transactions`);
  return response.data.data;
}
