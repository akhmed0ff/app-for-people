import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../domain/auth/role.enum';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;
}
