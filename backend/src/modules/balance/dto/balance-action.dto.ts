import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TopUpDriverDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdjustDriverBalanceDto {
  @IsInt()
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
