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
import { ReputationConfig } from './interfaces/reputation-config.interface';

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
    // Attempt to retrieve the 'reputation' namespace from the config registry
    const config = this.configService.get<ReputationConfig>('reputation');

    if (!config?.weights || !config.sigmoid) {
      this.logger.error(
        'Reputation Config retrieved as: ' + JSON.stringify(config),
      );
      throw new InternalServerErrorException(
        'Reputation configuration is missing or malformed. Ensure reputationConfig is loaded in AppModule.',
      );
    }

    const { weights, sigmoid } = config;

    // 1. History: Bayesian Expectation
    const historyBase = params.alpha / (params.alpha + params.beta);

    // 2. Verification Component with identity-specific weighting
    let verificationBase = 0;
    if (params.isEmailVerified) verificationBase += 0.3;
    if (params.isPhoneVerified) verificationBase += 0.7;

    // 3. Engagement Component: Logarithmic scaling to prevent farming
    const engagementBase = Math.min(Math.log10(params.tradeCount + 1), 1);

    // 4. Normalized Weighted Sum Model (Total Weight = 1.0)
    const rawSum =
      historyBase * weights.history +
      verificationBase * weights.verification +
      engagementBase * weights.engagement -
      params.penalties;

    // 5. Sigmoid Smoothing
    // Formula: S(rawSum) = 100 / (1 + e^-k(rawSum - x0))
    const finalScore = 100 / (1 + Math.exp(-sigmoid.k * (rawSum - sigmoid.x0)));

    return Number.parseFloat(finalScore.toFixed(2));
  }

  /**
   * Main entry point for reputation updates triggered by trade events.
   * Enforces the "Sticky Penalty" principle where trust is hard to build but easy to break.
   */
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
      user.penalties += 0.1;
    }

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
