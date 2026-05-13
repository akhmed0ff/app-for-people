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

export type OrderOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELED';

export type OrderOffer = {
  offerId: string;
  orderId: string;
  pickupAddress: string;
  pickupLat: number | string;
  pickupLng: number | string;
  destinationAddress: string;
  destinationLat: number | string;
  destinationLng: number | string;
  tariffCode?: string;
  estimatedPrice?: number;
  distanceKm?: number;
  routeDurationMinutes?: number | null;
  routeGeometry?: string | null;
  distanceToPickupKm?: number;
  expiresAt: string;
  status?: OrderOfferStatus;
};

export type PassengerInfo = {
  id?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
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
  destinationAddress?: string;
  destinationLat?: number | string;
  destinationLng?: number | string;
  distanceKm?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  routeDurationMinutes?: number | null;
  routeGeometry?: string | null;
  estimatedPrice?: number;
  fareCents?: number;
  currency: string;
  passenger?: PassengerInfo | null;
  createdAt: string;
  updatedAt?: string;
};

export type DriverLocation = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export type DriverBalance = {
  balance: number;
  commissionRatePercent: number;
  lastTransactions: DriverTransaction[];
};

export type DriverTransaction = {
  id: string;
  orderId?: string;
  amount: number;
  amountCents: number;
  type: 'TOP_UP' | 'TRIP_COMMISSION' | 'ADJUSTMENT' | string;
  description?: string;
  currency: string;
  createdAt: string;
};
