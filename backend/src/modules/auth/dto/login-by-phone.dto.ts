import { IsPhoneNumber, IsString } from 'class-validator';

export class LoginByPhoneDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;
}
