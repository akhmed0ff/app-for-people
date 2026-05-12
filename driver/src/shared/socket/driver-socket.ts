import { io, Socket } from 'socket.io-client';
import { DriverLocation, Order, OrderOffer, OrderStatus } from '../api/types';
import { env } from '../config/env';

type ServerToClientEvents = {
  connected: (payload: { heartbeatIntervalMs: number }) => void;
  'order.offered': (payload: OrderOffer) => void;
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

export function disconnectDriverSocket() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  socket?.disconnect();
  socket = null;
}
