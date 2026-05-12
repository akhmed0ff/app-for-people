import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, Max, Min } from 'class-validator';

export class NearbyDriversQueryDto {
  @ApiProperty({ example: 41.311081 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: 69.240562 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm!: number;
}
