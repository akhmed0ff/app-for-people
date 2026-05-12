export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type ApiResponse<T> = {
  data: T;
  timestamp: string;
};

export type OrderStatus =
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export type OrderOffer = {
  orderId: string;
  pickupAddress: string;
  pickupLat: number | string;
  pickupLng: number | string;
  dropoffAddress: string;
  dropoffLat: number | string;
  dropoffLng: number | string;
  distanceToPickupMeters?: number;
  tariff?: {
    name: string;
    currency: string;
  };
};

export type Order = {
  id: string;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat: number | string;
  pickupLng: number | string;
  dropoffAddress: string;
  dropoffLat: number | string;
  dropoffLng: number | string;
  fareCents?: number;
  currency: string;
  createdAt: string;
};

export type DriverLocation = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export type DriverBalance = {
  availableCents: number;
  pendingCents: number;
  lifetimeEarnedCents: number;
  currency: string;
};
