import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../domain/auth/role.enum';
import { IsEnum } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  role!: Role;
}
