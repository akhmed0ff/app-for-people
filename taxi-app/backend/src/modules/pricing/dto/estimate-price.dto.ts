import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class EstimatePriceDto {
  @ApiProperty({ example: 'ECONOMY' })
  @IsString()
  tariffCode!: string;

  @ApiProperty({ example: 4.7 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm!: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  waitingMinutes!: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  stopMinutes!: number;
}
