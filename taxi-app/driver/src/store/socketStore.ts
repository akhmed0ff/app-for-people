import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { OrderRealtimePayload } from '../types/api';
import { useOrderStore } from './orderStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  goOnline: () => void;
  goOffline: () => void;
  sendLocation: (payload: { lat: number; lng: number; heading?: number; speed?: number }) => void;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  connect: (token) => {
    const current = get().socket;
    if (current?.connected) return;
    current?.disconnect();

    const socket = io(env.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => set({ isConnected: true, error: null }));
    socket.on('disconnect', () => set({ isConnected: false }));
    socket.on('connect_error', () => set({ error: 'Нет realtime-соединения.' }));
    socket.on('order:created', (payload: OrderRealtimePayload) => {
      useOrderStore.getState().addAvailableOrder(payload.order);
    });
    socket.on('order:canceled', (payload: OrderRealtimePayload) => {
      useOrderStore.getState().removeAvailableOrder(payload.order.id);
      const active = useOrderStore.getState().activeOrder;
      if (active?.id === payload.order.id) {
        useOrderStore.getState().setActiveOrder(payload.order);
      }
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, error: null });
  },

  goOnline: () => get().socket?.emit('driver:online'),
  goOffline: () => get().socket?.emit('driver:offline'),
  sendLocation: (payload) => get().socket?.emit('driver:location:update', payload),
  joinOrder: (orderId) => get().socket?.emit('order:join', { orderId }),
  leaveOrder: (orderId) => get().socket?.emit('order:leave', { orderId }),
}));
