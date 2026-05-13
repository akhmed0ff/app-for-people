import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { DriverBalance, DriverLocation } from '../api/types';

const ONLINE_KEY = 'driver.online';

type DriverState = {
  online: boolean;
  location: DriverLocation | null;
  balance: DriverBalance;
  hydrated: boolean;
  setOnline: (online: boolean) => void;
  setLocation: (location: DriverLocation) => void;
  setBalance: (balance: DriverBalance) => void;
  hydrate: () => Promise<void>;
};

export const useDriverStore = create<DriverState>((set) => ({
  online: false,
  location: null,
  hydrated: false,
  balance: {
    balance: 0,
    commissionRatePercent: 10,
    lastTransactions: [],
  },
  setOnline: (online) => {
    void SecureStore.setItemAsync(ONLINE_KEY, online ? 'true' : 'false');
    set({ online });
  },
  setLocation: (location) => set({ location }),
  setBalance: (balance) => set({ balance }),
  hydrate: async () => {
    const online = (await SecureStore.getItemAsync(ONLINE_KEY)) === 'true';
    set({ online, hydrated: true });
  },
}));
