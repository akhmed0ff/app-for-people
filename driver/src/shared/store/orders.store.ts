import { create } from 'zustand';
import { Order, OrderOffer } from '../api/types';

type OrdersState = {
  queue: OrderOffer[];
  activeOrder: Order | null;
  history: Order[];
  enqueue: (offer: OrderOffer) => void;
  removeOffer: (orderId: string) => void;
  setActiveOrder: (order: Order | null) => void;
  setHistory: (history: Order[]) => void;
};

export const useOrdersStore = create<OrdersState>((set) => ({
  queue: [],
  activeOrder: null,
  history: [],
  enqueue: (offer) =>
    set((state) => ({
      queue: state.queue.some((item) => item.orderId === offer.orderId)
        ? state.queue
        : [...state.queue, offer],
    })),
  removeOffer: (orderId) =>
    set((state) => ({ queue: state.queue.filter((offer) => offer.orderId !== orderId) })),
  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setHistory: (history) => set({ history }),
}));
