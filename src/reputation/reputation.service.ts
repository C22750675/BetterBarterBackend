import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity.js';
import { Penalty } from '../users/entities/penalty.entity.js';
import {
  ReputationLog,
  ReputationChangeType,
} from './entities/reputation-log.entity.js';
import { DisputeSeverity } from '../trades/entities/dispute.entity.js';
import { ReputationConfig } from '../config/reputation.config.js';

export interface ReputationState {
  alpha: number;
  beta: number;
  tradeCount: number;
  penaltyWeight: number; // Calculated sum of decayed penalties
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Penalty)
    private readonly penaltyRepo: Repository<Penalty>,
    @InjectRepository(ReputationLog)
    private readonly logRepo: Repository<ReputationLog>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calculates the current cumulative penalty weight for a user.
   * Uses absolute values from config and applies decay per penalty.
   */
  public calculateCurrentPenaltyWeight(penalties: Penalty[]): number {
    const config = this.configService.get<ReputationConfig>('reputation');
    if (!config || !penalties) return 0;

    const severityMap = config.penalties.severities;
    const halfLife = config.decay.penaltyHalfLifeDays || 30;
    const now = Date.now();

    return penalties
      .filter((p) => p.isActive)
      .reduce((sum, penalty) => {
        // Get the impact directly from config based on the severity enum key
        const initialImpact = severityMap[penalty.severity] ?? 0;

        const msElapsed = now - penalty.createdAt.getTime();
        const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
        const decayFactor = Math.pow(0.5, daysElapsed / halfLife);

        return sum + initialImpact * decayFactor;
      }, 0);
  }

  /**
   * Applies decay to successes, failures, and trade counts.
   */
  public applyDecay(
    state: ReputationState,
    daysElapsed: number = 1,
  ): Omit<ReputationState, 'penaltyWeight'> {
    const config = this.configService.get<ReputationConfig>('reputation');
    if (!config) return state;

    const { alphaHalfLifeDays, betaHalfLifeDays, decayTradeCount } =
      config.decay;
    const { alpha: priorAlpha, beta: priorBeta } = config.priors;

    const alphaDecayFactor = Math.pow(0.5, daysElapsed / alphaHalfLifeDays);
    const betaDecayFactor = Math.pow(0.5, daysElapsed / betaHalfLifeDays);

    const newAlpha = priorAlpha + (state.alpha - priorAlpha) * alphaDecayFactor;
    const newBeta = priorBeta + (state.beta - priorBeta) * betaDecayFactor;

    const newTradeCount = decayTradeCount
      ? state.tradeCount * alphaDecayFactor
      : state.tradeCount;

    return {
      alpha: Math.max(0, newAlpha),
      beta: Math.max(0, newBeta),
      tradeCount: newTradeCount,
      isEmailVerified: state.isEmailVerified,
      isPhoneVerified: state.isPhoneVerified,
    };
  }

  public applyLazyDecay(user: User): ReputationState {
    const now = new Date();
    const lastUpdate = user.lastReputationUpdate || user.createdAt || now;
    const msElapsed = now.getTime() - lastUpdate.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

    const penaltyWeight = this.calculateCurrentPenaltyWeight(
      user.penaltyHistory,
    );

    if (daysElapsed < 0.01) {
      return {
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
        penaltyWeight,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      };
    }

    const decayedBase = this.applyDecay(
      {
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
        penaltyWeight,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
      daysElapsed,
    );

    return { ...decayedBase, penaltyWeight };
  }

  public calculateScore(params: ReputationState): number {
    const config = this.configService.get<ReputationConfig>('reputation');
    if (!config)
      throw new InternalServerErrorException('Reputation config missing');

    const { weights, sigmoid } = config;

    const historyScore = params.alpha / (params.alpha + params.beta);
    let verificationScore = 0;
    if (params.isEmailVerified) verificationScore += 0.5;
    if (params.isPhoneVerified) verificationScore += 0.5;

    const engagementScore = Math.log10(1 + params.tradeCount) / 2;

    const rawSum =
      historyScore * weights.history +
      verificationScore * weights.verification +
      Math.min(1, engagementScore) * weights.engagement -
      params.penaltyWeight;

    const finalScore = 100 / (1 + Math.exp(-sigmoid.k * (rawSum - sigmoid.x0)));
    return Number.parseFloat(finalScore.toFixed(2));
  }

  async updateReputation(
    userId: string,
    type: ReputationChangeType,
    reason?: string,
    severity?: DisputeSeverity,
    tradeId?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch user using the query runner manager
      // We use a pessimistic_write lock here to prevent race conditions if a user
      // receives two ratings at the exact same millisecond.
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['penaltyHistory'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        await queryRunner.rollbackTransaction();
        return;
      }

      // 2. Handle Penalty Creation
      if (
        type === ReputationChangeType.PENALTY &&
        severity &&
        severity !== DisputeSeverity.NONE
      ) {
        const penalty = this.penaltyRepo.create({
          user,
          severity,
          reason,
          relatedTradeId: tradeId,
          isActive: true,
        });
        await queryRunner.manager.save(penalty);
        user.penaltyHistory = [...(user.penaltyHistory || []), penalty];
      }

      // 3. Calculate new decayed state and update alpha/beta
      const decayedState = this.applyLazyDecay(user);
      Object.assign(user, {
        alpha: decayedState.alpha,
        beta: decayedState.beta,
        tradeCount: decayedState.tradeCount,
      });

      if (type === ReputationChangeType.SUCCESS) {
        user.alpha += 1;
        user.tradeCount += 1;
      } else if (type === ReputationChangeType.FAILURE) {
        user.beta += 1;
      }

      user.reputationScore = this.calculateScore({
        ...decayedState,
        alpha: user.alpha,
        beta: user.beta,
        tradeCount: user.tradeCount,
      });

      user.lastReputationUpdate = new Date();
      await queryRunner.manager.save(user);

      // 4. Save the Audit Log
      const log = this.logRepo.create({
        userId,
        changeType: type,
        resultingScore: user.reputationScore,
        alphaSnapshot: user.alpha,
        betaSnapshot: user.beta,
        reason: severity
          ? `[Resolution: ${severity.toUpperCase()}] ${reason}`
          : reason,
      });
      await queryRunner.manager.save(log);

      // 5. Commit all changes together
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to update reputation for user ${userId}`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
