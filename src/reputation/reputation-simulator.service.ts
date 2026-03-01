import { Injectable } from '@nestjs/common';
import { ReputationService } from './reputation.service';

export interface SimulationResult {
  day: number;
  alpha: number;
  beta: number;
  score: number;
  event: string;
}

interface InternalSimState {
  alpha: number;
  beta: number;
  tradeCount: number;
  penalties: number;
}

@Injectable()
export class ReputationSimulatorService {
  private readonly DECAY_FACTOR = Math.exp(-Math.log(2) / 180);

  constructor(private readonly reputationService: ReputationService) {}

  public runPersonaSimulation(
    persona: 'BOMBER' | 'REDEMPTION' | 'INCONSISTENT',
  ): SimulationResult[] {
    let state = this.initializeSimState();
    const history: SimulationResult[] = [];

    for (let day = 1; day <= 365; day++) {
      // 1. Progress Time (Temporal Decay)
      state = this.applyDailyDecay(state);

      // 2. Simulate Human Activity
      const eventLabel = this.applyPersonaBehavior(persona, day, state);

      // 3. Record Snapshot for Evaluation
      history.push(this.captureSnapshot(day, state, eventLabel));
    }

    return history;
  }

  private initializeSimState(): InternalSimState {
    return {
      alpha: 1, // Neutral Prior
      beta: 1,
      tradeCount: 0,
      penalties: 0,
    };
  }

  /**
   * Applies the daily exponential decay to Bayesian parameters.
   * Ensures trust drifts toward the neutral 1.0 state over time.
   */
  private applyDailyDecay(state: InternalSimState): InternalSimState {
    return {
      ...state,
      alpha: 1 + (state.alpha - 1) * this.DECAY_FACTOR,
      beta: 1 + (state.beta - 1) * this.DECAY_FACTOR,
    };
  }

  /**
   * Encapsulates behavioral patterns for different user types.
   */
  private applyPersonaBehavior(
    persona: string,
    day: number,
    state: InternalSimState,
  ): string {
    if (persona === 'BOMBER' && day <= 10) {
      return this.simulateReputationBombing(state);
    }

    if (persona === 'REDEMPTION') {
      return this.simulateRedemptionArc(day, state);
    }

    if (persona === 'INCONSISTENT' && day % 7 === 0) {
      return this.simulateInconsistentBehavior(state);
    }

    return 'No Activity';
  }

  private simulateReputationBombing(state: InternalSimState): string {
    // Simulate 10 positive trades in a day
    for (let i = 0; i < 10; i++) {
      state.alpha += 1;
      state.tradeCount += 1;
    }
    return 'High Frequency Successes';
  }

  private simulateRedemptionArc(day: number, state: InternalSimState): string {
    if (day === 1) {
      state.beta += 10;
      return 'Initial Major Failure';
    }
    if (day > 30 && day % 15 === 0) {
      state.alpha += 1;
      state.tradeCount += 1;
      return 'Slow Recovery Trade';
    }
    return 'No Activity';
  }

  private simulateInconsistentBehavior(state: InternalSimState): string {
    const isSuccess = Math.random() > 0.3; // 70% reliability
    if (isSuccess) state.alpha += 1;
    else state.beta += 1;
    state.tradeCount += 1;
    return isSuccess ? 'Success' : 'Failure';
  }

  private captureSnapshot(
    day: number,
    state: InternalSimState,
    event: string,
  ): SimulationResult {
    const score = this.reputationService.calculateScore({
      ...state,
      isEmailVerified: true,
      isPhoneVerified: false,
    });

    return {
      day,
      alpha: Number(state.alpha.toFixed(4)),
      beta: Number(state.beta.toFixed(4)),
      score,
      event,
    };
  }
}
