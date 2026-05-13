import { IsString, Matches } from 'class-validator';

export class UnregisterPushTokenDto {
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/)
  token!: string;
}
