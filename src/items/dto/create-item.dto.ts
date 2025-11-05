import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
  Matches,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

// Defines the data structure for creating a new item.
export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedValue: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  // Validates the date is a string in YYYY-MM-DD format
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bestBeforeDate must be in YYYY-MM-DD format',
  })
  bestBeforeDate?: string;

  @IsOptional()
  @IsString()
  // Validates the date is a string in YYYY-MM-DD format
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'useByDate must be in YYYY-MM-DD format',
  })
  useByDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
