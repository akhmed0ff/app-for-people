import { OrderStatus, Role } from './enums';

export type TokenPairDto = {
  accessToken: string;
  refreshToken: string;
};

export type CurrentUserDto = {
  id: string;
  role: Role;
  phone?: string;
};

export type PointDto = {
  address: string;
  latitude: number;
  longitude: number;
};

export type PriceEstimateRequestDto = {
  tariffCode: string;
  distanceMeters: number;
  waitingSeconds?: number;
  stopsCount?: number;
};

export type PriceEstimateDto = {
  tariffCode: string;
  currency: string;
  total: number;
  carSupplyPrice: number;
  distancePrice: number;
  waitingPrice: number;
  stopsPrice: number;
};

export type CreateOrderRequestDto = {
  pickup: PointDto;
  dropoff: PointDto;
  tariffId: string;
};

export type OrderDto = {
  id: string;
  status: OrderStatus;
  pickup: PointDto;
  dropoff: PointDto;
  tariffId: string;
  driverId?: string;
  passengerId: string;
  price?: PriceEstimateDto;
  createdAt: string;
  updatedAt: string;
};

export type DriverLocationDto = {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
};
