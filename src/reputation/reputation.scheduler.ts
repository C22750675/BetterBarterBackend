import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import { ReputationService } from './reputation.service';

@Injectable()
export class ReputationScheduler {
  private readonly logger = new Logger(ReputationScheduler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly reputationService: ReputationService,
  ) {}

  // Run this task at midnight every day to apply time decay to user reputations
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleWeeklyDecay() {
    this.logger.log('Starting weekly reputation decay check...');

    // Define "Stale": Score hasn't been updated in the last 7 days
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 7);

    // Find users who need an update
    // We use chunking (take/skip) or a cursor here if we had millions of users,
    // but for now, finding all stale users is acceptable.
    const staleUsers = await this.userRepository.find({
      where: {
        lastReputationUpdate: LessThan(staleDate),
      },
      select: ['id'], // We only need the ID to trigger the service
    });

    this.logger.log(
      `Found ${staleUsers.length} users requiring reputation updates.`,
    );

    for (const user of staleUsers) {
      try {
        await this.reputationService.calculateAndSaveScore(user.id);
      } catch (error) {
        this.logger.error(
          `Failed to update reputation for user ${user.id}`,
          error,
        );
      }
    }

    this.logger.log('Weekly reputation decay check complete.');
  }
}
