import { apiClient } from './client';
import { Driver, DriverStatus } from '../types/api';

export const adminDriversApi = {
  async getAll(status?: DriverStatus): Promise<Driver[]> {
    const response = await apiClient.get<Driver[]>('/admin/drivers', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  async block(id: string): Promise<Driver> {
    const response = await apiClient.patch<Driver>(`/admin/drivers/${id}/block`);
    return response.data;
  },

  async unblock(id: string): Promise<Driver> {
    const response = await apiClient.patch<Driver>(`/admin/drivers/${id}/unblock`);
    return response.data;
  },
};
