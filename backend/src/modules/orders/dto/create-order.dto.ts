import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
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

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiProperty()
  @IsNumber()
  pickupLat!: number;

  @ApiProperty()
  @IsNumber()
  pickupLng!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  destinationLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @ApiProperty({ required: false })
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
