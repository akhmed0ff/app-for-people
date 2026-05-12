import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EstimatePriceDto {
  @ApiProperty()
  @IsString()
  tariffCode!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  distanceMeters!: number;

  @ApiProperty({ default: 0 })
  @IsInt()
  @Min(0)
  waitingSeconds!: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stopsCount?: number;
}
