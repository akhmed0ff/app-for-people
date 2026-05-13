import { io, Socket } from 'socket.io-client';
import { DriverLocation, Order, OrderOffer, OrderStatus } from '../api/types';
import { env } from '../config/env';
import { useConnectionStore } from '../store/connection.store';

type ServerToClientEvents = {
  connected: (payload: { heartbeatIntervalMs: number }) => void;
  'order.offered': (payload: OrderOffer) => void;
  'order:offer:new': (payload: OrderOffer) => void;
  'order:offer:expired': (payload: { offerId: string; orderId: string }) => void;
  'order:offer:canceled': (payload: { offerId: string; orderId: string; reason?: string }) => void;
  'order:offer:accepted': (payload: { offerId: string; orderId: string }) => void;
  'order:offer:rejected': (payload: { offerId: string; orderId: string }) => void;
  'order.accepted': (payload: Order) => void;
  'order.canceled': (payload: Order) => void;
  'order.status.updated': (payload: Order) => void;
  'eta.updated': (payload: { orderId: string; distanceMeters: number; etaSeconds: number }) => void;
  'heartbeat.ack': (payload: { ok: boolean; serverTime: string }) => void;
  error: (payload: { message: string }) => void;
};

type ClientToServerEvents = {
  heartbeat: () => void;
  'driver.online': (payload?: DriverLocation) => void;
  'driver.offline': () => void;
  'driver.location.update': (payload: DriverLocation) => void;
  'order.join': (payload: { orderId: string }) => void;
  'order.accept': (payload: { orderId: string }) => void;
  'order.cancel': (payload: { orderId: string; reason?: string }) => void;
  'order.status.update': (payload: { orderId: string; status: OrderStatus }) => void;
  'eta.request': (payload: {
    orderId: string;
    driverLat: number;
    driverLng: number;
    destinationLat: number;
    destinationLng: number;
  }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function getDriverSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    disconnectDriverSocket();
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

export function disconnectDriverSocket() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  socket?.disconnect();
  socket = null;
  useConnectionStore.getState().setStatus('idle');
}
