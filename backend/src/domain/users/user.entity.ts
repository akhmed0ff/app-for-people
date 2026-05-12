import { Role } from '../auth/role.enum';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly phone: string | null,
    public readonly role: Role,
    public readonly status: UserStatus,
  ) {}
}
