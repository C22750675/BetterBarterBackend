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
import { DisputesController } from './disputes.controller.js';
import { Dispute } from './entities/dispute.entity.js';
import { Membership } from '../circles/entities/membership.entity.js';
import { DisputesService } from './disputes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trade,
      Item,
      Circle,
      Rating,
      TradeApplication,
      Message,
      Dispute,
      Membership,
    ]),
    ReputationModule,
  ],
  controllers: [TradesController, ChatController, DisputesController],
  providers: [TradesService, ChatService, DisputesService],
})
export class TradesModule {}
