import { io, Socket } from 'socket.io-client';
import { DriverLocation, Order, OrderStatus } from '../api/types';
import { env } from '../config/env';

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

  socket = io(env.socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  socket.on('connected', ({ heartbeatIntervalMs }) => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    heartbeatTimer = setInterval(() => socket?.emit('heartbeat'), heartbeatIntervalMs);
  });

  socket.io.on('reconnect', () => {
    socket?.emit('heartbeat');
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
}
