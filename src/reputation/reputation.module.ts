import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service.js';
import { ReputationScheduler } from './reputation.scheduler.js';
import { User } from '../users/entities/user.entity.js';
import { Rating } from '../trades/entities/rating.entity.js';
import { Trade } from '../trades/entities/trade.entity.js';
import { Dispute } from '../trades/entities/dispute.entity.js';
import { ReputationLog } from './entities/reputation-log.entity.js';
import { ReputationSimulatorService } from './reputation-simulator.service.js';
import { ReputationSimulatorController } from './reputation-simulator.controller.js';

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
