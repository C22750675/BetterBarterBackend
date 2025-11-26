import { IsEnum } from 'class-validator';
import { TradeStatus } from '../entities/trade.entity';

export class UpdateTradeStatusDto {
  @IsEnum(TradeStatus)
  status: TradeStatus;
}
