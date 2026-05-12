import { Role } from '../../domain/auth/role.enum';

export type JwtUser = {
  sub: string;
  email: string;
  role: Role;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
