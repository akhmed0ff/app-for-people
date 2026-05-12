import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDriverDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  licenseNumber!: string;

  @ApiProperty()
  @IsString()
  vehicleMake!: string;

  @ApiProperty()
  @IsString()
  vehicleModel!: string;

  @ApiProperty()
  @IsString()
  vehiclePlate!: string;
}
