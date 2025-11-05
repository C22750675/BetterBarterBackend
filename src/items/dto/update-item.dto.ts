import {
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

// Defines the data structure for updating an existing item. All fields are optional.
export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bestBeforeDate must be in YYYY-MM-DD format',
  })
  bestBeforeDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'useByDate must be in YYYY-MM-DD format',
  })
  useByDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
