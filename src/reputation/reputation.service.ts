import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import {
  ReputationLog,
  ReputationChangeType,
} from './entities/reputation-log.entity';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ReputationLog)
    private readonly logRepo: Repository<ReputationLog>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculates the trust score using parameters from the config module.
   * Allows for rapid sensitivity analysis during project evaluation phase.
   */
  public calculateScore(params: {
    alpha: number;
    beta: number;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    tradeCount: number;
    penalties: number;
  }): number {
    // Retrieve algorithmic parameters
    const weights = this.configService.get<{
      history: number;
      verification: number;
      engagement: number;
    }>('reputation.weights');
    const sigmoid = this.configService.get<{ k: number; x0: number }>(
      'reputation.sigmoid',
    );

    // 1. History: Bayesian Expectation
    const historyBase = params.alpha / (params.alpha + params.beta);

    // 2. Verification: Fixed Trust Floor [1]
    let verificationBase = 0;
    if (params.isEmailVerified) verificationBase += 0.3; // Email verification weight
    if (params.isPhoneVerified) verificationBase += 0.7; // Phone verification weight (harder to spoof)

    // 3. Engagement: Logarithmic diminishing returns
    const engagementBase = Math.min(Math.log10(params.tradeCount + 1), 1);

    // 4. Normalized Weighted Sum Model
    const rawSum =
      historyBase * weights.history +
      verificationBase * weights.verification +
      engagementBase * weights.engagement -
      params.penalties;

    // 5. Sigmoid Smoothing using config steepness (k) and midpoint (x0)
    // Formula: 100 / (1 + e^-k(rawSum - x0))
    const finalScore = 100 / (1 + Math.exp(-sigmoid.k * (rawSum - sigmoid.x0)));

    return Number.parseFloat(finalScore.toFixed(2));
  }

  /**
   * Main entry point for reputation updates triggered by trade events.
   * Enforces the "Sticky Penalty" principle where trust is hard to build but easy to break. [1]
   */
  async updateReputation(
    userId: string,
    type: ReputationChangeType,
    reason?: string,
  ) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return;

    // Behavioral state updates
    if (type === ReputationChangeType.SUCCESS) {
      user.alpha += 1;
      user.tradeCount += 1;
    }
    if (type === ReputationChangeType.FAILURE) user.beta += 1;
    if (type === ReputationChangeType.PENALTY) user.penalties += 0.1;

    // Calculate snapshot with updated state
    const newScore = this.calculateScore({
      alpha: user.alpha,
      beta: user.beta,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      tradeCount: user.tradeCount,
      penalties: user.penalties,
    });

    user.reputationScore = newScore;
    user.lastReputationUpdate = new Date();
    await this.userRepo.save(user);

    await this.logRepo.save({
      userId,
      changeType: type,
      resultingScore: user.reputationScore,
      alphaSnapshot: user.alpha,
      betaSnapshot: user.beta,
      reason,
    });
  }
}
