import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import {
  ReputationLog,
  ReputationChangeType,
} from './entities/reputation-log.entity';

export interface ReputationConfig {
  weights: {
    history: number;
    verification: number;
    engagement: number;
  };
  sigmoid: {
    k: number;
    x0: number;
  };
  decay: {
    halfLifeDays: number;
  };
  priors: {
    alpha: number;
    beta: number;
  };
}

export interface ReputationState {
  alpha: number;
  beta: number;
  tradeCount: number;
  penalties: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

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
   * Centralized logic for applying time decay.
   * Can be used by the Simulator or the Scheduler.
   */
  public applyDecay(state: ReputationState): ReputationState {
    const config = this.configService.get<ReputationConfig>('reputation');
    const halfLife = config?.decay?.halfLifeDays || 180;
    const decayFactor = Math.exp(-Math.log(2) / halfLife);

    return {
      ...state,
      // Alpha and Beta decay back toward the prior (1.0)
      alpha: 1 + (state.alpha - 1) * decayFactor,
      beta: 1 + (state.beta - 1) * decayFactor,
      // Engagement (tradeCount) decays toward zero to reflect recency
      tradeCount: state.tradeCount * decayFactor,
      // Penalties decay, allowing users to recover from old disputes.
      // We use the same decay factor so a penalty also has a 180-day half-life.
      penalties: state.penalties * decayFactor,
    };
  }

  /**
   * Calculates the trust score using parameters from the config module.
   */
  public calculateScore(params: ReputationState): number {
    const config = this.configService.get<ReputationConfig>('reputation');

    if (!config?.weights || !config.sigmoid) {
      throw new InternalServerErrorException(
        'Reputation configuration missing.',
      );
    }

    const { weights, sigmoid } = config;

    // 1. History: Bayesian Expectation
    const historyBase = params.alpha / (params.alpha + params.beta);

    // 2. Verification Component
    let verificationBase = 0;
    if (params.isEmailVerified) verificationBase += 0.3;
    if (params.isPhoneVerified) verificationBase += 0.7;

    // 3. Engagement Component
    const engagementBase = Math.min(Math.log10(params.tradeCount + 1), 1);

    // 4. Normalized Weighted Sum Model
    // We apply the penalty to the raw sum.
    const rawSum =
      historyBase * weights.history +
      verificationBase * weights.verification +
      engagementBase * weights.engagement -
      params.penalties;

    // 5. Sigmoid Smoothing
    const finalScore = 100 / (1 + Math.exp(-sigmoid.k * (rawSum - sigmoid.x0)));

    return Number.parseFloat(finalScore.toFixed(2));
  }

  async updateReputation(
    userId: string,
    type: ReputationChangeType,
    reason?: string,
  ) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return;

    if (type === ReputationChangeType.SUCCESS) {
      user.alpha += 1;
      user.tradeCount += 1;
    } else if (type === ReputationChangeType.FAILURE) {
      user.beta += 1;
    } else if (type === ReputationChangeType.PENALTY) {
      // A dispute adds to penalties. With the new decay logic,
      // this will slowly reduce over time.
      user.penalties += 0.1;
    }

    user.reputationScore = this.calculateScore({
      alpha: user.alpha,
      beta: user.beta,
      tradeCount: user.tradeCount,
      penalties: user.penalties,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    });

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
