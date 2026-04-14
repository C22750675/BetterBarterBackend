import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * DTO for updating an existing trade proposal.
 * Matches the UpdateTradeRequest from the Android frontend.
 */
export class UpdateTradeDto {
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsOptional()
  description?: string;
}
