import axios from 'axios';
import { api } from './client';
import { ApiResponse, Driver, Order, OrderOffer, Passenger, Payment, Tariff, TokenPair, User } from './types';

export async function loginAdmin(): Promise<TokenPair> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.info('[admin-auth] dev-login', { baseURL: api.defaults.baseURL, role: 'ADMIN' });
    }
    const response = await api.post<ApiResponse<TokenPair>>('/auth/dev-login', { role: 'ADMIN' });
    return response.data.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' && axios.isAxiosError(error)) {
      console.warn('[admin-auth] dev-login failed', {
        status: error.response?.status,
        message: error.response?.data?.message ?? error.message,
      });
    }
    throw error;
  }
}

export function getAdminLoginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Login failed: unknown error.';
  }

  if (!error.response) {
    return `Network error: backend is unavailable at ${api.defaults.baseURL}.`;
  }

  const status = error.response.status;
  const backendMessage = formatBackendMessage(error.response.data?.message);
  if (status === 403) {
    return `HTTP ${status}: ${backendMessage || 'Dev-login is disabled. Enable DEV_LOGIN_ENABLED=true or ENABLE_DEV_LOGIN=true in backend env.'}`;
  }
  if (status === 401) {
    return `HTTP ${status}: ${backendMessage || 'Seed admin user was not found. Run Prisma seed.'}`;
  }
  if (status === 404) {
    return `HTTP ${status}: ${backendMessage || 'Endpoint /auth/dev-login was not found.'} Check NEXT_PUBLIC_API_URL: ${api.defaults.baseURL}.`;
  }

  return `HTTP ${status}: ${backendMessage || 'Login failed.'}`;
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
  const response = await api.get<ApiResponse<Tariff[]>>('/tariffs/all');
  return response.data.data;
}

export async function createTariff(input: Omit<Tariff, 'id'>): Promise<Tariff> {
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

function formatBackendMessage(message: unknown) {
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return typeof message === 'string' ? message : '';
}
