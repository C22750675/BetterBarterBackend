import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Rating } from '../trades/entities/rating.entity';
import { Trade, TradeStatus } from '../trades/entities/trade.entity';
import {
  Dispute,
  DisputeSeverity,
  DisputeStatus,
} from '../trades/entities/dispute.entity';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(Trade) private tradeRepo: Repository<Trade>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
  ) {}

  /**
   * Main entry point to recalculate a user's score.
   * Call this whenever a rating is added, a dispute is resolved, or a verification occurs.
   */
  async calculateAndSaveScore(userId: string): Promise<number> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      this.logger.warn(
        `Attempted to update reputation for non-existent user ${userId}`,
      );
      return 0;
    }

    // Component 1: History (Time Decayed)
    // Weight: 50%
    const historyScore = await this.calculateHistoryScore(userId);

    // Component 2: Verification
    // Weight: 30%
    let verificationScore = 0;
    if (user.isEmailVerified) verificationScore += 10; // Simple email link
    if (user.isPhoneVerified) verificationScore += 20; // SMS verification is harder to fake

    // Component 3: Engagement
    // Weight: 10%
    // Uses "Effective Volume" to reward consistency over spam
    const engagementScore = await this.calculateEngagementScore(userId);

    // Component 4: Penalties
    // Subtraction
    const penaltyScore = await this.calculatePenaltyScore(userId);

    // Aggregate Raw Score
    // Weights: History (50%), Verification (30%), Engagement (10%)
    const rawScore =
      historyScore * 0.5 +
      verificationScore +
      engagementScore * 0.2 -
      penaltyScore;

    // Final Normalization (Sigmoid)
    const finalScore = this.sigmoid(rawScore);

    // Save to DB
    user.reputationScore = parseFloat(finalScore.toFixed(2));
    user.lastReputationUpdate = new Date();
    await this.userRepo.save(user);

    this.logger.log(
      `Updated reputation for user ${userId}. Raw: ${rawScore}, Final: ${user.reputationScore}`,
    );

    return user.reputationScore;
  }

  /**
   * Calculates the "History" component of the reputation score.
   * This uses a time-decayed average of all ratings received by the user.
   * Newer ratings have more weight, and older ratings decay exponentially.
   *
   * @param userId The ID of the user whose history score we want to calculate.
   * @returns A score between 0 and 100 representing the user's historical performance, with time decay applied.
   */
  private async calculateHistoryScore(userId: string): Promise<number> {
    const ratings = await this.ratingRepo.find({ where: { rateeId: userId } });

    // Cold Start Buffer: Trustworthy until proven otherwise
    if (ratings.length === 0) return 60;

    let totalWeightedScore = 0;
    let totalMaxPossible = 0;

    const now = new Date().getTime();
    const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 180;

    for (const rating of ratings) {
      const ageInMs = now - rating.createdAt.getTime();
      // Decay formula: Value * (0.5 ^ (age / 6_months))
      const halfLives = ageInMs / SIX_MONTHS_MS;
      const decayFactor = Math.pow(0.5, halfLives);

      // Normalize rating (1-5) to 0-100 scale
      const ratingVal = (rating.score / 5) * 100;

      totalWeightedScore += ratingVal * decayFactor;
      totalMaxPossible += 100 * decayFactor;
    }

    return totalMaxPossible === 0
      ? 0
      : (totalWeightedScore / totalMaxPossible) * 100;
  }

  private async calculateEngagementScore(userId: string): Promise<number> {
    // Fetch completed trades with their completion dates
    const trades = await this.tradeRepo.find({
      where: [
        { proposerId: userId, status: TradeStatus.COMPLETED },
        { recipientId: userId, status: TradeStatus.COMPLETED },
      ],
      select: ['id', 'completionDate'],
    });

    if (trades.length === 0) return 0;

    // Group trades by "Absolute Week Number" to check consistency
    // We treat the trade list as a time-series.
    const tradesByWeek = new Map<number, number>();

    for (const trade of trades) {
      // Fallback to current date if completionDate is missing (legacy data)
      const date = trade.completionDate
        ? new Date(trade.completionDate)
        : new Date();

      // Calculate a unique integer for each week since Epoch
      // 1000ms * 60s * 60m * 24h * 7d = ms per week
      const weekIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * 7));

      tradesByWeek.set(weekIndex, (tradesByWeek.get(weekIndex) || 0) + 1);
    }

    // Calculate "Effective Volume"
    // We cap the contribution of any single week to prevent "spamming" for score
    let effectiveVolume = 0;
    const WEEKLY_CAP = 3; // Max 3 trades per week count towards the score

    tradesByWeek.forEach((count) => {
      effectiveVolume += Math.min(count, WEEKLY_CAP);
    });

    // Logarithmic growth on the EFFECTIVE volume
    // This rewards long-term consistency.
    // 1 effective trade  -> 22 * ln(2)  = 15.2
    // 10 effective trades -> 22 * ln(11) = 52.7
    // 50 effective trades -> 22 * ln(51) = 86.4 (Requires ~17 weeks of consistent trading)
    // 100 effective trades -> 22 * ln(101) = 101 (Capped at 100)
    const score = 22 * Math.log(effectiveVolume + 1);

    return Math.min(score, 100);
  }

  private async calculatePenaltyScore(userId: string): Promise<number> {
    const disputes = await this.disputeRepo.find({
      where: { culpritId: userId, status: DisputeStatus.RESOLVED },
    });

    let penalty = 0;
    for (const d of disputes) {
      switch (d.severity) {
        case DisputeSeverity.LOW:
          penalty += 5;
          break;
        case DisputeSeverity.MEDIUM:
          penalty += 15;
          break;
        case DisputeSeverity.HIGH:
          penalty += 50;
          break;
      }
    }
    return penalty;
  }

  private sigmoid(x: number): number {
    const k = 0.05; // Steepness
    const midpoint = 50;
    return 100 / (1 + Math.exp(-k * (x - midpoint)));
  }
}
