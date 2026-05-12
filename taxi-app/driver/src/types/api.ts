export type UserRole = 'ADMIN' | 'PASSENGER' | 'DRIVER';
export type DriverStatus = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'BLOCKED';
export type OrderStatus =
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface Driver {
  id: string;
  userId: string;
  carModel: string;
  carNumber: string;
  status: DriverStatus;
  balance: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
}

export interface AuthProfile {
  user: User;
  passenger: null;
  driver: Driver | null;
}

export interface DevLoginResponse extends AuthProfile {
  accessToken: string;
  developmentOnly: true;
}

export interface Order {
  id: string;
  passengerId: string;
  driverId: string | null;
  tariffId: string;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  waitingMinutes: number;
  stopMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverMeProfile {
  user: User;
  driver: Driver;
  currentLocation: DriverLocation | null;
  activeOrder: Order | null;
}

export interface OrderRealtimePayload {
  order: Order;
  passengerId: string;
  driverId: string | null;
}
