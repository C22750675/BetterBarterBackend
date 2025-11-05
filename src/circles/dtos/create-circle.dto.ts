import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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

export class CreateCircleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => OriginPointDto)
  origin: OriginPointDto;

  @IsInt()
  @IsNotEmpty()
  radius: number; // Radius in meters

  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'Color must be a valid hex code (e.g., #FF0000)',
  })
  color?: string;
}
