import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/)
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';

  @IsOptional()
  @IsString()
  deviceId?: string;
}
