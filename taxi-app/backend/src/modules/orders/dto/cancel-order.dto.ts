import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Passenger changed plans', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
