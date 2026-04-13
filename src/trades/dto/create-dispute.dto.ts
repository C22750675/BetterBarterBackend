import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsUUID()
  @IsNotEmpty()
  tradeId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Please provide at least 10 characters describing the issue.',
  })
  description!: string;
}
