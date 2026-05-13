import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { DriverLocation, Order, Point, PriceEstimate, Tariff } from '../api/types';

const ACTIVE_ORDER_KEY = 'customer.activeOrder';
const terminalStatuses = new Set(['COMPLETED', 'CANCELED']);

type BookingState = {
  pickup: Point | null;
  dropoff: Point | null;
  selectedTariff: Tariff | null;
  estimate: PriceEstimate | null;
  activeOrder: Order | null;
  driverLocation: DriverLocation | null;
  hydrated: boolean;
  setPickup: (point: Point) => void;
  setDropoff: (point: Point) => void;
  setTariff: (tariff: Tariff) => void;
  setEstimate: (estimate: PriceEstimate | null) => void;
  setActiveOrder: (order: Order | null) => void;
  hydrateActiveOrder: () => Promise<void>;
  setDriverLocation: (location: DriverLocation | null) => void;
  resetBooking: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  pickup: null,
  dropoff: null,
  selectedTariff: null,
  estimate: null,
  activeOrder: null,
  driverLocation: null,
  hydrated: false,
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setTariff: (selectedTariff) => set({ selectedTariff }),
  setEstimate: (estimate) => set({ estimate }),
  setActiveOrder: (activeOrder) => {
    if (!activeOrder || terminalStatuses.has(activeOrder.status)) {
      void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      set({ activeOrder: null, driverLocation: null });
      return;
    }
    void SecureStore.setItemAsync(ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
    set((state) => {
      const current = state.activeOrder;
      if (
        current?.id === activeOrder.id &&
        current.status === activeOrder.status &&
        current.updatedAt === activeOrder.updatedAt
      ) {
        return state;
      }
      return { activeOrder };
    });
  },
  hydrateActiveOrder: async () => {
    const raw = await SecureStore.getItemAsync(ACTIVE_ORDER_KEY);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const activeOrder = JSON.parse(raw) as Order;
      set({ activeOrder: terminalStatuses.has(activeOrder.status) ? null : activeOrder, hydrated: true });
    } catch {
      await SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      set({ activeOrder: null, hydrated: true });
    }
  },
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  resetBooking: () => {
    void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
    set({
      dropoff: null,
      selectedTariff: null,
      estimate: null,
      activeOrder: null,
      driverLocation: null,
    });
  },
}));
