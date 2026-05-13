import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RouteEstimateDto {
  @ApiProperty({ example: 41.0198 })
  @IsNumber()
  pickupLat!: number;

  @ApiProperty({ example: 70.1284 })
  @IsNumber()
  pickupLng!: number;

  @ApiProperty({ example: 41.0125 })
  @IsNumber()
  destinationLat!: number;

  @ApiProperty({ example: 70.1393 })
  @IsNumber()
  destinationLng!: number;

  @ApiProperty({ example: 'ECONOMY' })
  @IsString()
  tariffCode!: string;
}
