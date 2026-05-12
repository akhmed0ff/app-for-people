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

export interface AuthProfile {
  user: User;
  passenger: null;
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
  createdAt?: string;
  updatedAt?: string;
}

export type TariffPayload = Omit<Tariff, 'id' | 'createdAt' | 'updatedAt'>;

export interface Order {
  id: string;
  passengerId: string;
  driverId: string | null;
  tariffId: string;
  status: OrderStatus;
  pickupAddress: string;
  destinationAddress: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
}
