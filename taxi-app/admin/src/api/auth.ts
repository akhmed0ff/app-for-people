import { apiClient } from './client';
import { AuthProfile, DevLoginResponse } from '../types/api';

export const authApi = {
  async devLogin(phone: string): Promise<DevLoginResponse> {
    const response = await apiClient.post<DevLoginResponse>('/auth/dev-login', {
      phone,
      role: 'ADMIN',
    });

    return response.data;
  },

  async me(): Promise<AuthProfile> {
    const response = await apiClient.get<AuthProfile>('/auth/me');

    return response.data;
  },
};
