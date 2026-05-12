import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateDriverStatusDto {
  @ApiProperty({ enum: [DriverStatus.ONLINE, DriverStatus.OFFLINE], example: DriverStatus.ONLINE })
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}
