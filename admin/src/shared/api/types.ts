export type ApiResponse<T> = {
  data: T;
  timestamp: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type User = {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DRIVER' | 'PASSENGER';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
};

export type Driver = {
  id: string;
  status: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  rating: string;
  balance: number;
  commissionRatePercent: number;
  user: User;
};

export type Passenger = {
  id: string;
  rating: string;
  user: User;
  createdAt: string;
};

export type Order = {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareCents?: number;
  currency: string;
  createdAt: string;
  passenger?: Passenger;
  driver?: Driver;
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
  isActive: boolean;
};

export type Payment = {
  id: string;
  type: string;
  status: string;
  amount: number;
  amountCents: number;
  currency: string;
  provider?: string;
  description?: string;
  createdAt: string;
};
