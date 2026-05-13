import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { Order } from '../api/types';

const ACTIVE_ORDER_KEY = 'driver.activeOrder';
const terminalStatuses = new Set(['COMPLETED', 'CANCELED']);

type OrdersState = {
  activeOrder: Order | null;
  history: Order[];
  hydrated: boolean;
  setActiveOrder: (order: Order | null) => void;
  hydrateActiveOrder: () => Promise<void>;
  setHistory: (history: Order[]) => void;
};

export const useOrdersStore = create<OrdersState>((set) => ({
  activeOrder: null,
  history: [],
  hydrated: false,
  setActiveOrder: (activeOrder) => {
    if (!activeOrder || terminalStatuses.has(activeOrder.status)) {
      void SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
      set({ activeOrder: null });
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
  setHistory: (history) => set({ history }),
}));
