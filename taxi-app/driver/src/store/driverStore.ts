import { create } from 'zustand';
import { driversApi } from '../api/drivers';
import { Driver, DriverLocation, DriverStatus, Order } from '../types/api';

interface DriverState {
  driver: Driver | null;
  currentLocation: DriverLocation | null;
  activeOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  loadMe: () => Promise<void>;
  updateStatus: (status: Extract<DriverStatus, 'ONLINE' | 'OFFLINE'>) => Promise<Driver | null>;
  updateLocation: (payload: { lat: number; lng: number; heading?: number; speed?: number }) => Promise<DriverLocation | null>;
}

export const useDriverStore = create<DriverState>((set) => ({
  driver: null,
  currentLocation: null,
  activeOrder: null,
  isLoading: false,
  error: null,

  loadMe: async () => {
    set({ isLoading: true, error: null });

    try {
      const profile = await driversApi.me();
      set({
        driver: profile.driver,
        currentLocation: profile.currentLocation,
        activeOrder: profile.activeOrder,
      });
    } catch {
      set({ error: 'Не удалось загрузить профиль водителя.' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStatus: async (status) => {
    set({ isLoading: true, error: null });

    try {
      const driver = await driversApi.updateStatus(status);
      set({ driver });
      return driver;
    } catch {
      set({ error: 'Не удалось изменить статус.' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateLocation: async (payload) => {
    try {
      const location = await driversApi.updateLocation(payload);
      set({ currentLocation: location });
      return location;
    } catch {
      set({ error: 'Не удалось отправить геолокацию.' });
      return null;
    }
  },
}));
