import { create } from 'zustand';
import { getCurrentDriverLocation } from '../services/location';
import { useDriverStore } from './driverStore';
import { useSocketStore } from './socketStore';

interface LocationState {
  lastLocation: { lat: number; lng: number; heading?: number; speed?: number } | null;
  isLoading: boolean;
  error: string | null;
  refreshAndSend: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  lastLocation: null,
  isLoading: false,
  error: null,

  refreshAndSend: async () => {
    const status = useDriverStore.getState().driver?.status;

    if (status !== 'ONLINE' && status !== 'BUSY') {
      set({ error: 'Геолокация отправляется только в ONLINE/BUSY.' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const location = await getCurrentDriverLocation();
      set({ lastLocation: location });
      await useDriverStore.getState().updateLocation(location);
      useSocketStore.getState().sendLocation(location);
    } catch {
      set({ error: 'Нет доступа к геолокации.' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
