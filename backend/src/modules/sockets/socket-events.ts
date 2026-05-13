import { OrderStatus } from '@prisma/client';
import { Role } from '../../domain/auth/role.enum';
import { JwtUser } from '../auth/auth.types';

export const SocketEvent = {
  DriverOnline: 'driver.online',
  DriverOffline: 'driver.offline',
  DriverLocationUpdate: 'driver.location.update',
  DriverLocationUpdated: 'driver.location.updated',
  DriverNearestSearch: 'driver.nearest.search',
  DriverNearestFound: 'driver.nearest.found',
  OrderDispatch: 'order.dispatch',
  OrderJoin: 'order.join',
  OrderOffered: 'order.offered',
  OrderMatchingStarted: 'order:matching_started',
  OrderOfferNew: 'order:offer:new',
  OrderOfferAccepted: 'order:offer:accepted',
  OrderOfferRejected: 'order:offer:rejected',
  OrderOfferExpired: 'order:offer:expired',
  OrderNoDriversAvailable: 'order:no_drivers_available',
  OrderOfferCanceled: 'order:offer:canceled',
  OrderAccept: 'order.accept',
  OrderAccepted: 'order.accepted',
  OrderCancel: 'order.cancel',
  OrderCanceled: 'order.canceled',
  OrderStatusUpdate: 'order.status.update',
  OrderStatusUpdated: 'order.status.updated',
  EtaRequest: 'eta.request',
  EtaUpdated: 'eta.updated',
  Heartbeat: 'heartbeat',
  HeartbeatAck: 'heartbeat.ack',
  Error: 'error',
} as const;

export type SocketEventName = (typeof SocketEvent)[keyof typeof SocketEvent];

export type AuthenticatedSocketData = {
  user: JwtUser;
  role: Role;
  driverId?: string;
  passengerId?: string;
};

export type DriverLocationPayload = {
  driverId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export type NearestDriverPayload = {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
};

export type DispatchOrderPayload = {
  orderId: string;
  radiusMeters?: number;
  limit?: number;
};

export type OrderActionPayload = {
  orderId: string;
  reason?: string;
};

export type OrderStatusPayload = {
  orderId: string;
  status: OrderStatus;
};

export type EtaPayload = {
  orderId: string;
  driverLat: number;
  driverLng: number;
  destinationLat: number;
  destinationLng: number;
};

export type EtaResult = {
  orderId: string;
  distanceMeters: number;
  etaSeconds: number;
};

export type ServerToClientEvents = {
  connected: (payload: {
    socketId: string;
    userId: string;
    role: Role;
    heartbeatIntervalMs: number;
  }) => void;
  [SocketEvent.DriverOnline]: (payload: { driverId: string; status: 'ONLINE' }) => void;
  [SocketEvent.DriverOffline]: (payload: { driverId: string; status: 'OFFLINE' }) => void;
  [SocketEvent.DriverLocationUpdated]: (payload: DriverLocationPayload & { updatedAt: Date }) => void;
  [SocketEvent.DriverNearestFound]: (payload: Array<{ driverId: string; distanceMeters: number }>) => void;
  [SocketEvent.OrderDispatch]: (payload: unknown) => void;
  [SocketEvent.OrderJoin]: (payload: unknown) => void;
  [SocketEvent.OrderOffered]: (payload: unknown) => void;
  [SocketEvent.OrderMatchingStarted]: (payload: unknown) => void;
  [SocketEvent.OrderOfferNew]: (payload: unknown) => void;
  [SocketEvent.OrderOfferAccepted]: (payload: unknown) => void;
  [SocketEvent.OrderOfferRejected]: (payload: unknown) => void;
  [SocketEvent.OrderOfferExpired]: (payload: unknown) => void;
  [SocketEvent.OrderNoDriversAvailable]: (payload: unknown) => void;
  [SocketEvent.OrderOfferCanceled]: (payload: unknown) => void;
  [SocketEvent.OrderAccepted]: (payload: unknown) => void;
  [SocketEvent.OrderCanceled]: (payload: unknown) => void;
  [SocketEvent.OrderStatusUpdated]: (payload: unknown) => void;
  [SocketEvent.EtaUpdated]: (payload: EtaResult) => void;
  [SocketEvent.HeartbeatAck]: (payload: { ok: boolean; serverTime: string }) => void;
  [SocketEvent.Error]: (payload: { message: string }) => void;
};

export type ClientToServerEvents = {
  [SocketEvent.DriverOnline]: (payload?: DriverLocationPayload) => void;
  [SocketEvent.DriverOffline]: () => void;
  [SocketEvent.DriverLocationUpdate]: (payload: DriverLocationPayload) => void;
  [SocketEvent.DriverNearestSearch]: (payload: NearestDriverPayload) => void;
  [SocketEvent.OrderDispatch]: (payload: DispatchOrderPayload) => void;
  [SocketEvent.OrderJoin]: (payload: OrderActionPayload) => void;
  [SocketEvent.OrderAccept]: (payload: OrderActionPayload) => void;
  [SocketEvent.OrderCancel]: (payload: OrderActionPayload) => void;
  [SocketEvent.OrderStatusUpdate]: (payload: OrderStatusPayload) => void;
  [SocketEvent.EtaRequest]: (payload: EtaPayload) => void;
  [SocketEvent.Heartbeat]: () => void;
};

export const Rooms = {
  driver: (driverId: string) => `driver:${driverId}`,
  passenger: (passengerId: string) => `passenger:${passengerId}`,
  order: (orderId: string) => `order:${orderId}`,
  admins: 'admins',
  driversOnline: 'drivers:online',
};
