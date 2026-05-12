export type Role = 'ADMIN' | 'DRIVER' | 'PASSENGER';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type ApiResponse<T> = {
  data: T;
  timestamp: string;
};

export type Point = {
  address: string;
  latitude: number;
  longitude: number;
};

export type Tariff = {
  id: string;
  code: string;
  name: string;
  description?: string;
  carSupplyPrice: number;
  pricePerKm: number;
  freeWaitingMinutes: number;
  waitingPricePerMinute: number;
  stopPrice: number;
  minimumOrderPrice: number;
  currency: string;
};

export type PriceEstimate = {
  tariffCode: string;
  currency: string;
  distanceKm: number;
  billableWaitingMinutes: number;
  stopsCount: number;
  carSupplyPrice: number;
  distancePrice: number;
  waitingPrice: number;
  stopsPrice: number;
  subtotal: number;
  minimumOrderPrice: number;
  total: number;
};

export type OrderStatus =
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export type Order = {
  id: string;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat: string | number;
  pickupLng: string | number;
  dropoffAddress: string;
  dropoffLat: string | number;
  dropoffLng: string | number;
  fareCents?: number;
  currency: string;
  driverId?: string;
  tariffId?: string;
  createdAt: string;
};

export type DriverLocation = {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt?: string;
};
