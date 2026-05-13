import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RouteEstimateDto {
  @ApiProperty({ example: 41.311081 })
  @IsNumber()
  pickupLat!: number;

  @ApiProperty({ example: 69.240562 })
  @IsNumber()
  pickupLng!: number;

  @ApiProperty({ example: 41.299496 })
  @IsNumber()
  destinationLat!: number;

  @ApiProperty({ example: 69.240073 })
  @IsNumber()
  destinationLng!: number;

  @ApiProperty({ example: 'ECONOMY' })
  @IsString()
  tariffCode!: string;
}
