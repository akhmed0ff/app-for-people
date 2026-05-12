import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePassengerDto {
  @ApiProperty()
  @IsString()
  userId!: string;
}
