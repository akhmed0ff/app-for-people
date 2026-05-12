import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  passengerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tariffId?: string;

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiProperty()
  @IsNumber()
  pickupLat!: number;

  @ApiProperty()
  @IsNumber()
  pickupLng!: number;

  @ApiProperty()
  @IsString()
  dropoffAddress!: string;

  @ApiProperty()
  @IsNumber()
  dropoffLat!: number;

  @ApiProperty()
  @IsNumber()
  dropoffLng!: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
