import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ReputationService } from './reputation.service';
import { ReputationChangeType } from './entities/reputation-log.entity';

@Injectable()
export class ReputationScheduler {
  private readonly logger = new Logger(ReputationScheduler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reputationService: ReputationService,
  ) {}

  // Run this task at midnight every day to apply time decay to user reputations
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyDecay() {
    // Exponential decay factor for half-life of 180 days
    const decayFactor = Math.exp(-Math.log(2) / 180);

    // Fetch all users to apply decay
    const users = await this.userRepo.find();

    for (const user of users) {
      const oldAlpha = user.alpha;

      user.alpha = 1 + (user.alpha - 1) * decayFactor;
      user.beta = 1 + (user.beta - 1) * decayFactor;

      if (Math.abs(user.alpha - oldAlpha) > 0.001) {
        user.reputationScore = this.reputationService.calculateScore({
          alpha: user.alpha,
          beta: user.beta,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          tradeCount: user.tradeCount,
          penalties: user.penalties,
        });

        await this.userRepo.save(user);
        await this.reputationService.updateReputation(
          user.id,
          ReputationChangeType.DECAY,
          'Daily half-life decay applied',
        );
      }
    }
  }
}
