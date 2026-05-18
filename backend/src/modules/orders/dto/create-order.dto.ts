import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../infrastructure/database/prisma-enums';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '5-й микрорайон, Ангрен' })
  @IsOptional()
  @IsString()
  passengerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tariffId?: string;

  @ApiProperty({ required: false, example: 'ECONOMY' })
  @IsOptional()
  @IsString()
  tariffCode?: string;

  @ApiProperty({ example: 41.0198 })
  @IsString()
  pickupAddress!: string;

  @ApiProperty({ example: 70.1284 })
  @IsNumber()
  pickupLat!: number;

  @ApiProperty()
  @IsNumber()
  pickupLng!: number;

  @ApiProperty({ required: false, example: 'Базар Ангрен' })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @ApiProperty({ required: false, example: 'Базар Ангрен' })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiProperty({ required: false, example: 41.0125 })
  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @ApiProperty({ required: false, example: 41.0125 })
  @IsOptional()
  @IsNumber()
  destinationLat?: number;

  @ApiProperty({ required: false, example: 70.1393 })
  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @ApiProperty({ required: false, example: 70.1393 })
  @IsOptional()
  @IsNumber()
  destinationLng?: number;

  @ApiProperty({ required: false, description: 'Development-only manual fallback when Mapbox is not configured.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  distanceMeters?: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
