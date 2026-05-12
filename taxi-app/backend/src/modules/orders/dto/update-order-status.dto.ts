import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 4.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm!: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  waitingMinutes!: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  stopMinutes!: number;
}
