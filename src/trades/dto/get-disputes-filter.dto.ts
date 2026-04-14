import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DisputeStatus } from '../entities/dispute.entity.js';

export class GetDisputesFilterDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsUUID()
  circleId?: string;
}
