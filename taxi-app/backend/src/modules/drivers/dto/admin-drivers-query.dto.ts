import { ApiPropertyOptional } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AdminDriversQueryDto {
  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
