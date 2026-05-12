import { Driver, DriverLocation, Order, User } from '@prisma/client';

export interface DriverMeProfile {
  user: Pick<User, 'id' | 'phone' | 'name' | 'role' | 'isActive'>;
  driver: Driver;
  currentLocation: DriverLocation | null;
  activeOrder: Order | null;
}

export interface NearbyDriver {
  driverId: string;
  carModel: string;
  carNumber: string;
  rating: number;
  status: Driver['status'];
  location: DriverLocation;
  distanceKm: number;
}
