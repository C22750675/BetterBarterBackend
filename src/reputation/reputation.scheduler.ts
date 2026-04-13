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
   * Only target users who haven't updated in over 24 hours.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyDecay() {
    this.logger.log(
      'Starting maintenance reputation decay for inactive users...',
    );

    // Only fetch users who haven't been updated in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const users = await this.userRepo.find({
      where: {
        lastReputationUpdate: LessThan(oneDayAgo),
      },
    });

    let updatedCount = 0;

    for (const user of users) {
      // Apply lazy decay to catch up
      const decayedState = this.reputationService.applyLazyDecay(user);

      // Update entity
      user.alpha = decayedState.alpha;
      user.beta = decayedState.beta;
      user.penalties = decayedState.penalties;
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
