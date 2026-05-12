import { create } from 'zustand';
import { RouteDraft } from '../types/location';

const defaultRoute: RouteDraft = {
  pickup: {
    address: 'Точка А, центр Ташкента',
    lat: 41.311081,
    lng: 69.240562,
  },
  destination: {
    address: 'Точка Б, район Минор',
    lat: 41.299496,
    lng: 69.240073,
  },
  distanceKm: 4.7,
};

interface LocationState {
  route: RouteDraft;
  useDemoRoute: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  route: defaultRoute,
  useDemoRoute: () => set({ route: defaultRoute }),
}));
