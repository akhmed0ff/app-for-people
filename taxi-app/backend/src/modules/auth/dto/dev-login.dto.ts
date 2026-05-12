import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsPhoneNumber } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({ example: '+998901112233' })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DRIVER })
  @IsEnum(UserRole)
  role!: UserRole;
}
