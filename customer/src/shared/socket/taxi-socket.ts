import { io, Socket } from 'socket.io-client';
import { DriverLocation, Order, OrderStatus } from '../api/types';
import { env } from '../config/env';
import { useConnectionStore } from '../store/connection.store';

export type ServerToClientEvents = {
  connected: (payload: { socketId: string; heartbeatIntervalMs: number }) => void;
  'driver.location.updated': (payload: DriverLocation) => void;
  'order.offered': (payload: unknown) => void;
  'order.accepted': (payload: Order) => void;
  'order.canceled': (payload: Order) => void;
  'order.status.updated': (payload: Order) => void;
  'eta.updated': (payload: { orderId: string; distanceMeters: number; etaSeconds: number }) => void;
  'heartbeat.ack': (payload: { ok: boolean; serverTime: string }) => void;
  error: (payload: { message: string }) => void;
};

export type ClientToServerEvents = {
  heartbeat: () => void;
  'driver.nearest.search': (payload: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    limit?: number;
  }) => void;
  'order.dispatch': (payload: { orderId: string; radiusMeters?: number; limit?: number }) => void;
  'order.join': (payload: { orderId: string }) => void;
  'order.cancel': (payload: { orderId: string; reason?: string }) => void;
  'eta.request': (payload: {
    orderId: string;
    driverLat: number;
    driverLng: number;
    destinationLat: number;
    destinationLng: number;
  }) => void;
  'order.status.update': (payload: { orderId: string; status: OrderStatus }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function getTaxiSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    disconnectTaxiSocket();
  }

  useConnectionStore.getState().setStatus('connecting');
  socket = io(env.socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });

  socket.on('connected', ({ heartbeatIntervalMs }) => {
    useConnectionStore.getState().setStatus('connected');
    useConnectionStore.getState().setError(null);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    heartbeatTimer = setInterval(() => socket?.emit('heartbeat'), heartbeatIntervalMs);
  });

  socket.io.on('reconnect', () => {
    useConnectionStore.getState().setStatus('connected');
    socket?.emit('heartbeat');
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    useConnectionStore.getState().setReconnectAttempt(attempt);
  });

  socket.on('disconnect', () => {
    useConnectionStore.getState().setStatus('disconnected');
  });

  socket.on('connect_error', (error) => {
    useConnectionStore.getState().setError(error.message);
  });

  socket.on('error', (error) => {
    useConnectionStore.getState().setError(error.message);
  });

  return socket;
}

export function disconnectTaxiSocket() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  socket?.disconnect();
  socket = null;
  useConnectionStore.getState().setStatus('idle');
}
