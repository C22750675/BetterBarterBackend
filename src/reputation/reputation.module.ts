import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationScheduler } from './reputation.scheduler';
import { User } from '../users/entities/user.entity';
import { Rating } from '../trades/entities/rating.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Dispute } from '../trades/entities/dispute.entity';
import { ReputationLog } from './entities/reputation-log.entity';
import { ReputationSimulatorService } from './reputation-simulator.service';
import { ReputationSimulatorController } from './reputation-simulator.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Rating, Trade, Dispute, ReputationLog]),
  ],
  controllers: [ReputationSimulatorController],
  providers: [
    ReputationService,
    ReputationScheduler,
    ReputationSimulatorService,
  ],
  exports: [ReputationService],
})
export class ReputationModule {}
