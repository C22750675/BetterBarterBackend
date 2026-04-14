import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { ReputationService } from './reputation.service.js';

@Injectable()
export class ReputationScheduler {
  private readonly logger = new Logger(ReputationScheduler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reputationService: ReputationService,
  ) {}

  /**
   * Daily Maintenance Task.
   * Updates inactive users so their reputation decay is reflected in the DB.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyDecay() {
    this.logger.log('Starting maintenance reputation decay...');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Fetch users with their penalty history to ensure accurate score recalculation
    const users = await this.userRepo.find({
      where: {
        lastReputationUpdate: LessThan(oneDayAgo),
      },
      relations: ['penaltyHistory'],
    });

    let updatedCount = 0;

    for (const user of users) {
      const decayedState = this.reputationService.applyLazyDecay(user);

      user.alpha = decayedState.alpha;
      user.beta = decayedState.beta;
      user.tradeCount = decayedState.tradeCount;
      user.reputationScore =
        this.reputationService.calculateScore(decayedState);
      user.lastReputationUpdate = new Date();

      await this.userRepo.save(user);
      updatedCount++;
    }

    this.logger.log(
      `Maintenance decay complete. Updated ${updatedCount} inactive accounts.`,
    );
  }
}
