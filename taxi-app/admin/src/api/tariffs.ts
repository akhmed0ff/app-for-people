import { apiClient } from './client';
import { Tariff, TariffPayload } from '../types/api';

export const tariffsApi = {
  async getAll(): Promise<Tariff[]> {
    const response = await apiClient.get<Tariff[]>('/tariffs');
    return response.data;
  },
};

export const adminTariffsApi = {
  async create(payload: TariffPayload): Promise<Tariff> {
    const response = await apiClient.post<Tariff>('/admin/tariffs', payload);
    return response.data;
  },

  async update(id: string, payload: Partial<TariffPayload>): Promise<Tariff> {
    const response = await apiClient.patch<Tariff>(`/admin/tariffs/${id}`, payload);
    return response.data;
  },

  async toggle(id: string): Promise<Tariff> {
    const response = await apiClient.patch<Tariff>(`/admin/tariffs/${id}/toggle`);
    return response.data;
  },
};
