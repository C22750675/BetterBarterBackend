import { IsEnum } from 'class-validator';
import { TradeStatus } from '../entities/trade.entity.js';

export class UpdateTradeStatusDto {
  @IsEnum(TradeStatus)
  status!: TradeStatus;
}
