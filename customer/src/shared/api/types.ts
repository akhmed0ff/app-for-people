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

export type AddressSuggestion = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  placeType: string;
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

export type PricingBreakdown = {
  baseFare: number;
  distancePrice: number;
  waitingPrice: number;
  stopPrice: number;
  minimumFare: number;
  totalPrice: number;
};

export type RouteGeometry = string | null;

export type RouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  geometry: RouteGeometry;
  tariffCode: string;
  estimatedPrice: number;
  pricingBreakdown: PricingBreakdown;
};

export type TariffEstimate = {
  tariff: Tariff;
  estimate: RouteEstimate | null;
  isLoading: boolean;
  error: string | null;
};

export type OrderStatus =
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export type PassengerTripState =
  | 'IDLE'
  | 'SEARCHING_DRIVER'
  | 'NO_DRIVERS_AVAILABLE'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'ERROR';

export type AssignedDriver = {
  id: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat: string | number;
  pickupLng: string | number;
  dropoffAddress: string;
  dropoffLat: string | number;
  dropoffLng: string | number;
  distanceMeters?: number;
  durationSeconds?: number;
  routeDurationMinutes?: number | null;
  routeGeometry?: RouteGeometry;
  fareCents?: number;
  currency: string;
  driverId?: string;
  driver?: AssignedDriver | null;
  tariffId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type DriverLocation = {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt?: string;
};
