import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationScheduler } from './reputation.scheduler';
import { User } from '../users/entities/user.entity';
import { Rating } from '../trades/entities/rating.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Dispute } from '../trades/entities/dispute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rating, Trade, Dispute])],
  providers: [ReputationService, ReputationScheduler],
  exports: [ReputationService],
})
export class ReputationModule {}
