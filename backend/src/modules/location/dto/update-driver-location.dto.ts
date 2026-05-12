import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDriverLocationDto {
  @ApiProperty()
  @IsString()
  driverId!: string;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  speed?: number;
}
