import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class JoinCircleDto {
  @IsLatitude()
  @Type(() => Number)
  lat!: number;

  @IsLongitude()
  @Type(() => Number)
  lon!: number;
}
