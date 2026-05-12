import { Driver, Passenger, User, UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
}

export type AuthenticatedUser = Pick<User, 'id' | 'phone' | 'name' | 'role' | 'isActive'>;

export interface AuthProfile {
  user: AuthenticatedUser;
  passenger: Passenger | null;
  driver: Driver | null;
}

export interface DevLoginResponse extends AuthProfile {
  accessToken: string;
  developmentOnly: true;
}
