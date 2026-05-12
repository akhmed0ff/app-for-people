import { apiClient } from './client';
import { Order } from '../types/api';

export interface CompleteOrderPayload {
  distanceKm: number;
  waitingMinutes: number;
  stopMinutes: number;
}

export const ordersApi = {
  async available(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders/available');

    return response.data;
  },

  async accept(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/orders/${orderId}/accept`);

    return response.data;
  },

  async arrived(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/orders/${orderId}/arrived`);

    return response.data;
  },

  async start(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/orders/${orderId}/start`);

    return response.data;
  },

  async complete(orderId: string, payload: CompleteOrderPayload): Promise<Order> {
    const response = await apiClient.post<Order>(`/orders/${orderId}/complete`, payload);

    return response.data;
  },

  async my(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders/my');

    return response.data;
  },
};
