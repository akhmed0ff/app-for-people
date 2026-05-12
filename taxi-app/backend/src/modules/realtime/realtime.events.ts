import { DriverLocation, DriverStatus, Order, UserRole } from '@prisma/client';

export const CLIENT_SOCKET_EVENTS = {
  DRIVER_ONLINE: 'driver:online',
  DRIVER_OFFLINE: 'driver:offline',
  DRIVER_LOCATION_UPDATE: 'driver:location:update',
  ORDER_JOIN: 'order:join',
  ORDER_LEAVE: 'order:leave',
} as const;

export const SERVER_SOCKET_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_ACCEPTED: 'order:accepted',
  ORDER_DRIVER_ARRIVED: 'order:driver_arrived',
  ORDER_STARTED: 'order:started',
  ORDER_COMPLETED: 'order:completed',
  ORDER_CANCELED: 'order:canceled',
  DRIVER_LOCATION_UPDATED: 'driver:location:updated',
  DRIVER_STATUS_UPDATED: 'driver:status:updated',
} as const;

export const INTERNAL_REALTIME_EVENTS = {
  ORDER_CREATED: 'internal.order.created',
  ORDER_ACCEPTED: 'internal.order.accepted',
  ORDER_DRIVER_ARRIVED: 'internal.order.driver_arrived',
  ORDER_STARTED: 'internal.order.started',
  ORDER_COMPLETED: 'internal.order.completed',
  ORDER_CANCELED: 'internal.order.canceled',
  DRIVER_STATUS_UPDATED: 'internal.driver.status_updated',
  DRIVER_LOCATION_UPDATED: 'internal.driver.location_updated',
} as const;

export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  passenger: (passengerId: string) => `passenger:${passengerId}`,
  driver: (driverId: string) => `driver:${driverId}`,
  order: (orderId: string) => `order:${orderId}`,
  driversOnline: 'drivers:online',
  admins: 'admins',
} as const;

export interface SocketUserData {
  userId: string;
  phone: string;
  role: UserRole;
  passengerId?: string;
  driverId?: string;
}

export interface OrderRealtimePayload {
  order: Order;
  passengerId: string;
  driverId: string | null;
}

export interface DriverStatusRealtimePayload {
  driverId: string;
  status: DriverStatus;
}

export interface DriverLocationRealtimePayload {
  driverId: string;
  orderId?: string;
  location: DriverLocation;
}
