import { OrderStatus } from '../../../infrastructure/database/prisma-enums';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DispatchOrderDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  radiusMeters?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class OrderActionDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OrderStatusDto {
  @IsString()
  orderId!: string;

  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
