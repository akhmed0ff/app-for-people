import { create } from 'zustand';
import { ordersApi } from '../api/orders';
import { Order } from '../types/api';

interface OrderState {
  availableOrders: Order[];
  activeOrder: Order | null;
  history: Order[];
  isLoading: boolean;
  error: string | null;
  setActiveOrder: (order: Order | null) => void;
  addAvailableOrder: (order: Order) => void;
  removeAvailableOrder: (orderId: string) => void;
  loadAvailable: () => Promise<void>;
  accept: (orderId: string) => Promise<Order | null>;
  arrived: () => Promise<void>;
  start: () => Promise<void>;
  complete: (payload: { distanceKm: number; waitingMinutes: number; stopMinutes: number }) => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  availableOrders: [],
  activeOrder: null,
  history: [],
  isLoading: false,
  error: null,

  setActiveOrder: (order) => set({ activeOrder: order }),
  addAvailableOrder: (order) =>
    set((state) => ({
      availableOrders: state.availableOrders.some((item) => item.id === order.id)
        ? state.availableOrders
        : [order, ...state.availableOrders],
    })),
  removeAvailableOrder: (orderId) =>
    set((state) => ({
      availableOrders: state.availableOrders.filter((order) => order.id !== orderId),
    })),

  loadAvailable: async () => {
    set({ isLoading: true, error: null });

    try {
      const orders = await ordersApi.available();
      set({ availableOrders: orders });
    } catch {
      set({ error: 'Не удалось загрузить доступные заказы.' });
    } finally {
      set({ isLoading: false });
    }
  },

  accept: async (orderId) => {
    set({ isLoading: true, error: null });

    try {
      const order = await ordersApi.accept(orderId);
      set((state) => ({
        activeOrder: order,
        availableOrders: state.availableOrders.filter((item) => item.id !== orderId),
      }));
      return order;
    } catch {
      set({ error: 'Не удалось принять заказ.' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  arrived: async () => {
    const order = get().activeOrder;
    if (!order) return;
    const updated = await ordersApi.arrived(order.id);
    set({ activeOrder: updated });
  },

  start: async () => {
    const order = get().activeOrder;
    if (!order) return;
    const updated = await ordersApi.start(order.id);
    set({ activeOrder: updated });
  },

  complete: async (payload) => {
    const order = get().activeOrder;
    if (!order) return;
    const updated = await ordersApi.complete(order.id, payload);
    set({ activeOrder: null, history: [updated, ...get().history] });
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
