import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { DisputeSeverity } from '../entities/dispute.entity.js';

export class ResolveDisputeDto {
  @IsEnum(DisputeSeverity)
  @IsNotEmpty()
  severity!: DisputeSeverity;

  @IsString()
  @IsNotEmpty()
  resolutionNote!: string;

  @IsUUID()
  @IsNotEmpty()
  culpritId!: string;
}
