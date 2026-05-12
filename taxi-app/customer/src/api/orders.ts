import { apiClient } from './client';
import { CreateOrderPayload, Order } from '../types/api';

export const ordersApi = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', payload);

    return response.data;
  },

  async my(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders/my');

    return response.data;
  },

  async cancel(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/orders/${orderId}/cancel`, {});

    return response.data;
  },
};
