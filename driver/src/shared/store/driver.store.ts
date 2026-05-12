import { create } from 'zustand';
import { DriverBalance, DriverLocation } from '../api/types';

type DriverState = {
  online: boolean;
  location: DriverLocation | null;
  balance: DriverBalance;
  setOnline: (online: boolean) => void;
  setLocation: (location: DriverLocation) => void;
  setBalance: (balance: DriverBalance) => void;
};

export const useDriverStore = create<DriverState>((set) => ({
  online: false,
  location: null,
  balance: {
    availableCents: 0,
    pendingCents: 0,
    lifetimeEarnedCents: 0,
    currency: 'UZS',
  },
  setOnline: (online) => set({ online }),
  setLocation: (location) => set({ location }),
  setBalance: (balance) => set({ balance }),
}));
