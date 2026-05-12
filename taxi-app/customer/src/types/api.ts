export type UserRole = 'ADMIN' | 'PASSENGER' | 'DRIVER';

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

export interface Passenger {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  carModel: string;
  carNumber: string;
  status: string;
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
  passenger: Passenger | null;
  driver: Driver | null;
}

export interface DevLoginResponse extends AuthProfile {
  accessToken: string;
  developmentOnly: true;
}

export interface Tariff {
  id: string;
  code: string;
  name: string;
  baseFare: number;
  pricePerKm: number;
  freeWaitingMinutes: number;
  waitingPricePerMinute: number;
  stopPricePerMinute: number;
  minimumFare: number;
  isActive: boolean;
}

export interface PriceEstimate {
  tariffCode: string;
  distanceKm: number;
  baseFare: number;
  distancePrice: number;
  waitingPrice: number;
  stopPrice: number;
  minimumFare: number;
  totalPrice: number;
}

export interface CreateOrderPayload {
  tariffCode: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
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
  acceptedAt?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRealtimePayload {
  order: Order;
  passengerId: string;
  driverId: string | null;
}

export interface DriverLocationPayload {
  driverId: string;
  orderId?: string;
  location: DriverLocation;
}
