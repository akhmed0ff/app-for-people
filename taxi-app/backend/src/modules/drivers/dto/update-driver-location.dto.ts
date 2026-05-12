import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDriverLocationDto {
  @ApiProperty({ example: 41.311081 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: 69.240562 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;
}
