import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'ECONOMY' })
  @IsString()
  tariffCode!: string;

  @ApiProperty({ example: 'Точка А' })
  @IsString()
  pickupAddress!: string;

  @ApiProperty({ example: 41.311081 })
  @Type(() => Number)
  @IsLatitude()
  pickupLat!: number;

  @ApiProperty({ example: 69.240562 })
  @Type(() => Number)
  @IsLongitude()
  pickupLng!: number;

  @ApiProperty({ example: 'Точка Б' })
  @IsString()
  destinationAddress!: string;

  @ApiProperty({ example: 41.299496 })
  @Type(() => Number)
  @IsLatitude()
  destinationLat!: number;

  @ApiProperty({ example: 69.240073 })
  @Type(() => Number)
  @IsLongitude()
  destinationLng!: number;

  @ApiProperty({ example: 4.7 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm!: number;
}
