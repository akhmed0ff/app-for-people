import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SocketLocationDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;
}
