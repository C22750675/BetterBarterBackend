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
    alphaHalfLifeDays: number;
    betaHalfLifeDays: number;
    penaltyHalfLifeDays: number;
    decayTradeCount: boolean;
  };
  priors: {
    alpha: number;
    beta: number;
  };
  penalties: {
    defaultImpact: number;
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
   * Regression to Priors with asymmetrical alpha/beta decay + Penalty Cool-off.
   */
  public applyDecay(
    state: ReputationState,
    daysElapsed: number = 1,
  ): ReputationState {
    const config = this.configService.get<ReputationConfig>('reputation');
    if (!config) return state;

    const {
      alphaHalfLifeDays,
      betaHalfLifeDays,
      penaltyHalfLifeDays,
      decayTradeCount,
    } = config.decay;
    const { alpha: priorAlpha, beta: priorBeta } = config.priors;

    // Calculate independent decay factors for successes and failures
    const alphaDecayFactor = Math.pow(0.5, daysElapsed / alphaHalfLifeDays);
    const betaDecayFactor = Math.pow(0.5, daysElapsed / betaHalfLifeDays);
    const penaltyDecayFactor = Math.pow(
      0.5,
      daysElapsed / (penaltyHalfLifeDays || 30),
    );

    // Regression to Priors: Decay moves toward neutral start using independent rates
    const newAlpha = priorAlpha + (state.alpha - priorAlpha) * alphaDecayFactor;
    const newBeta = priorBeta + (state.beta - priorBeta) * betaDecayFactor;

    // Penalties decay toward zero (cool-off)
    const newPenalties = state.penalties * penaltyDecayFactor;

    // Engagement (Experience) Preservation logic
    // Using alpha decay factor as proxy for general engagement if enabled
    const newTradeCount = decayTradeCount
      ? state.tradeCount * alphaDecayFactor
      : state.tradeCount;

    return {
      ...state,
      alpha: Math.max(0, newAlpha),
      beta: Math.max(0, newBeta),
      tradeCount: newTradeCount,
      penalties: Math.max(0, newPenalties),
    };
  }

  /**
   * Applies decay lazily based on the time difference since the last update.
   */
  public applyLazyDecay(user: User): ReputationState {
    const now = new Date();
    const lastUpdate = user.lastReputationUpdate || user.createdAt || now;
    const msElapsed = now.getTime() - lastUpdate.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

    // Only apply if at least a significant fraction of a day has passed
    if (daysElapsed < 0.01) {
      return {
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
        penalties: user.penalties,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      };
    }

    return this.applyDecay(
      {
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
        penalties: user.penalties,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      daysElapsed,
    );
  }

  /**
   * Calculates the final sigmoid score.
   */
  public calculateScore(params: ReputationState): number {
    const config = this.configService.get<ReputationConfig>('reputation');
    if (!config)
      throw new InternalServerErrorException('Reputation config missing');

    const { weights, sigmoid } = config;

    // 1. History: Bayesian average (Success Rate)
    const historyScore = params.alpha / (params.alpha + params.beta);

    // 2. Verification: Identity trust
    let verificationScore = 0;
    if (params.isEmailVerified) verificationScore += 0.5;
    if (params.isPhoneVerified) verificationScore += 0.5;

    // 3. Engagement: Transaction volume (Logarithmic scaling)
    const engagementScore = Math.log10(1 + params.tradeCount) / 2; // Normalized to ~0-1 range

    // 4. Raw Sum (Weighted) - Penalties (Linear)
    const rawSum =
      historyScore * weights.history +
      verificationScore * weights.verification +
      Math.min(1, engagementScore) * weights.engagement -
      params.penalties;

    // 5. Sigmoid Smoothing
    const finalScore = 100 / (1 + Math.exp(-sigmoid.k * (rawSum - sigmoid.x0)));
    return Number.parseFloat(finalScore.toFixed(2));
  }

  /**
   * Main entry point for reputation updates triggered by trade events.
   * Implements Lazy Decay before applying the new event.
   */
  async updateReputation(
    userId: string,
    type: ReputationChangeType,
    reason?: string,
  ) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return;

    // 1. Apply Lazy Decay
    const decayedState = this.applyLazyDecay(user);
    Object.assign(user, decayedState);

    const config = this.configService.get<ReputationConfig>('reputation');

    // 2. Apply new event
    if (type === ReputationChangeType.SUCCESS) {
      user.alpha += 1;
      user.tradeCount += 1;
    } else if (type === ReputationChangeType.FAILURE) {
      user.beta += 1;
    } else if (type === ReputationChangeType.PENALTY) {
      user.penalties += config?.penalties?.defaultImpact ?? 0.05;
    }

    // 3. Final calculation
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

    // Log the event
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
