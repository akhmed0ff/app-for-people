import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SocketLocationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  driverId?: string;

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
