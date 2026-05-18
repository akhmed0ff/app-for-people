import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../infrastructure/database/prisma-enums';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
