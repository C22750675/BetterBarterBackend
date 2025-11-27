import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { Item } from 'src/items/entities/item.entity';
import { Circle } from 'src/circles/entities/circle.entity';
import { Rating } from './entities/rating.entity';
import { TradeApplication } from './entities/trade-application.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trade,
      Item,
      Circle,
      Rating,
      TradeApplication,
      Message,
    ]),
  ],
  controllers: [TradesController, ChatController],
  providers: [TradesService, ChatService],
})
export class TradesModule {}
