import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { DriverLocationPayload, OrderRealtimePayload } from '../types/api';
import { useTripStore } from './tripStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  connect: (token) => {
    const current = get().socket;

    if (current?.connected) {
      return;
    }

    current?.disconnect();

    const socket = io(env.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => set({ isConnected: true, error: null }));
    socket.on('disconnect', () => set({ isConnected: false }));
    socket.on('connect_error', () => set({ error: 'Нет realtime-соединения.' }));

    const updateOrder = (payload: OrderRealtimePayload) => {
      useTripStore.getState().setActiveOrder(payload.order);
    };

    socket.on('order:accepted', updateOrder);
    socket.on('order:driver_arrived', updateOrder);
    socket.on('order:started', updateOrder);
    socket.on('order:completed', updateOrder);
    socket.on('order:canceled', updateOrder);
    socket.on('driver:location:updated', (payload: DriverLocationPayload) => {
      useTripStore.getState().setDriverLocation(payload.location);
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, error: null });
  },

  joinOrder: (orderId) => {
    get().socket?.emit('order:join', { orderId });
  },

  leaveOrder: (orderId) => {
    get().socket?.emit('order:leave', { orderId });
  },
}));
