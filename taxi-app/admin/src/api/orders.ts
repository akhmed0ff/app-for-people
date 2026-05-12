import { apiClient } from './client';
import { Order, OrderStatus } from '../types/api';

export const adminOrdersApi = {
  async getAll(status?: OrderStatus): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/admin/orders', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },
};
