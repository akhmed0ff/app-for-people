import { apiClient } from './client';
import { PriceEstimate } from '../types/api';

export interface EstimatePayload {
  tariffCode: string;
  distanceKm: number;
  waitingMinutes: number;
  stopMinutes: number;
}

export const pricingApi = {
  async estimate(payload: EstimatePayload): Promise<PriceEstimate> {
    const response = await apiClient.post<PriceEstimate>('/pricing/estimate', payload);

    return response.data;
  },
};
