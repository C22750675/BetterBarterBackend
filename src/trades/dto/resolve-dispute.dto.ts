import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DisputeSeverity } from '../entities/dispute.entity.js';

export class ResolveDisputeDto {
  @IsEnum(DisputeSeverity)
  @IsNotEmpty()
  severity!: DisputeSeverity;

  @IsString()
  @IsOptional()
  resolutionNote?: string;

  /**
   * Optional culpritId. If provided, the admin explicitly chooses who gets the penalty.
   * This allows the admin to penalize the reporter if they were found to be at fault
   * or acting in bad faith.
   */
  @IsOptional()
  @IsUUID()
  culpritId?: string;
}
