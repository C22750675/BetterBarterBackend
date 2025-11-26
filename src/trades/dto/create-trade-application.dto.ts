import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTradeApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  offeredItemId: string;

  @IsInt()
  @Min(1)
  offeredItemQuantity: number;

  @IsString()
  @IsOptional()
  message: string;
}
