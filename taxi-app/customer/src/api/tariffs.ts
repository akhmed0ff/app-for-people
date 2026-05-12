import { apiClient } from './client';
import { Tariff } from '../types/api';

export const tariffsApi = {
  async getAll(): Promise<Tariff[]> {
    const response = await apiClient.get<Tariff[]>('/tariffs');

    return response.data;
  },
};
