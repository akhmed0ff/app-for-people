import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
