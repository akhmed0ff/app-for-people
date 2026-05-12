import { apiClient } from './client';
import { Driver, DriverLocation, DriverMeProfile, DriverStatus } from '../types/api';

export interface DriverLocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export const driversApi = {
  async me(): Promise<DriverMeProfile> {
    const response = await apiClient.get<DriverMeProfile>('/drivers/me');

    return response.data;
  },

  async updateStatus(status: Extract<DriverStatus, 'ONLINE' | 'OFFLINE'>): Promise<Driver> {
    const response = await apiClient.patch<Driver>('/drivers/me/status', { status });

    return response.data;
  },

  async updateLocation(payload: DriverLocationPayload): Promise<DriverLocation> {
    const response = await apiClient.patch<DriverLocation>('/drivers/me/location', payload);

    return response.data;
  },
};
