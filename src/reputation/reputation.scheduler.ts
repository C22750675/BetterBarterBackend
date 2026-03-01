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

  /**
   * Run this task at midnight every day to apply time decay to user reputations.
   * This now uses the centralized applyDecay logic to ensure consistency
   * between the simulator and production.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyDecay() {
    this.logger.log('Starting daily reputation decay process...');

    // Fetch all users to apply decay
    const users = await this.userRepo.find();
    let updatedCount = 0;

    for (const user of users) {
      const oldAlpha = user.alpha;
      const oldScore = user.reputationScore;

      // Use the unified decay logic which now includes tradeCount (Engagement) decay
      const decayedState = this.reputationService.applyDecay({
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
        penalties: user.penalties,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      });

      // Update the user entity with decayed values
      user.alpha = decayedState.alpha;
      user.beta = decayedState.beta;
      user.tradeCount = decayedState.tradeCount;

      // Only update and log if there is a significant change in alpha or the resulting score
      if (Math.abs(user.alpha - oldAlpha) > 0.0001) {
        user.reputationScore =
          this.reputationService.calculateScore(decayedState);
        user.lastReputationUpdate = new Date();

        await this.userRepo.save(user);

        // Log the change for audit purposes
        await this.reputationService.updateReputation(
          user.id,
          ReputationChangeType.DECAY,
          `Daily decay applied: Score changed from ${oldScore} to ${user.reputationScore}`,
        );

        updatedCount++;
      }
    }

    this.logger.log(
      `Reputation decay complete. Updated ${updatedCount} users.`,
    );
  }
}
