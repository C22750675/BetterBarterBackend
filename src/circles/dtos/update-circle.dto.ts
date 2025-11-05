import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
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
  @IsNotEmpty()
  name?: string;

  @ValidateNested()
  @Type(() => OriginPointDto)
  origin?: OriginPointDto;

  @IsInt()
  @IsNotEmpty()
  radius?: number; // Radius in meters
}
