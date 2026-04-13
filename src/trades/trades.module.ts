import { Module } from '@nestjs/common';
import { TradesService } from './trades.service.js';
import { TradesController } from './trades.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity.js';
import { Item } from '../items/entities/item.entity.js';
import { Circle } from '../circles/entities/circle.entity.js';
import { Rating } from './entities/rating.entity.js';
import { TradeApplication } from './entities/trade-application.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { ReputationModule } from '../reputation/reputation.module.js';

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
    ReputationModule,
  ],
  controllers: [TradesController, ChatController],
  providers: [TradesService, ChatService],
})
export class TradesModule {}
