import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ example: 'ECONOMY' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Эконом' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 8000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  baseFare!: number;

  @ApiProperty({ example: 2000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pricePerKm!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeWaitingMinutes!: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  waitingPricePerMinute!: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stopPricePerMinute!: number;

  @ApiProperty({ example: 10000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumFare!: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
