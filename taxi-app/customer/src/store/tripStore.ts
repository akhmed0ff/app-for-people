import { create } from 'zustand';
import { ordersApi } from '../api/orders';
import { CreateOrderPayload, DriverLocation, Order } from '../types/api';

interface TripState {
  activeOrder: Order | null;
  driverLocation: DriverLocation | null;
  history: Order[];
  isLoading: boolean;
  error: string | null;
  setActiveOrder: (order: Order | null) => void;
  setDriverLocation: (location: DriverLocation | null) => void;
  createOrder: (payload: CreateOrderPayload) => Promise<Order | null>;
  cancelActiveOrder: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  activeOrder: null,
  driverLocation: null,
  history: [],
  isLoading: false,
  error: null,

  setActiveOrder: (order) => set({ activeOrder: order }),
  setDriverLocation: (location) => set({ driverLocation: location }),

  createOrder: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const order = await ordersApi.create(payload);
      set({ activeOrder: order, driverLocation: null });
      return order;
    } catch {
      set({ error: 'Не удалось создать заказ.' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelActiveOrder: async () => {
    const order = get().activeOrder;

    if (!order) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const canceled = await ordersApi.cancel(order.id);
      set({ activeOrder: canceled });
    } catch {
      set({ error: 'Не удалось отменить заказ.' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadHistory: async () => {
    set({ isLoading: true, error: null });

    try {
      const history = await ordersApi.my();
      set({ history });
    } catch {
      set({ error: 'Не удалось загрузить историю.' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
