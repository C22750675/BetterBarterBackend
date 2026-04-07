import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Point } from 'geojson';

// A DTO for the 'origin' Point object
class OriginPointDto implements Point {
  @IsString()
  type: 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number]; // [longitude, latitude]
}

export class UpdateCircleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => OriginPointDto)
  origin?: OriginPointDto;

  @IsInt()
  @IsOptional()
  radius?: number; // Radius in meters

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
