import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTariffDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  carSupplyPrice!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  pricePerKm!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  freeWaitingMinutes!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  waitingPricePerMinute!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  stopPrice!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  minimumOrderPrice!: number;

  @ApiProperty({ default: 'UZS', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * Controls visibility to drivers and passengers.
   * When false, the tariff is excluded from GET /tariffs (client endpoint)
   * but still visible in GET /tariffs/all (admin endpoint).
   * Defaults to true on creation so new tariffs are immediately live.
   */
  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
