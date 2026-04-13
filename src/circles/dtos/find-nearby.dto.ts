import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional } from 'class-validator';

export class FindNearbyDto {
  @IsLatitude()
  @Type(() => Number)
  lat!: number;

  @IsLongitude()
  @Type(() => Number)
  lon!: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  radius!: number;
}
