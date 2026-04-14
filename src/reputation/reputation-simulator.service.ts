import { Injectable, Logger } from '@nestjs/common';
import { ReputationService, ReputationState } from './reputation.service.js';
import { ConfigService } from '@nestjs/config';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MARKETPLACE_PERSONAS,
  PersonaBehavior,
} from './types/personas.types.js';
import { ReputationConfig } from '../config/reputation.config.js';

export interface SimulationResult {
  day: number;
  alpha: number;
  beta: number;
  penaltyWeight: number;
  score: number;
  event: string;
}

@Injectable()
export class ReputationSimulatorService {
  private readonly logger = new Logger(ReputationSimulatorService.name);

  constructor(
    private readonly reputationService: ReputationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Runs the simulation for all defined personas and triggers the Python plotter.
   */
  public runFullBatchSimulation() {
    const scriptsDir = path.join(process.cwd(), 'scripts', 'simulator_plotter');
    const dataDir = path.join(scriptsDir, 'data');
    const plotterPath = path.join(scriptsDir, 'reputation_plotter.py');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    for (const persona of MARKETPLACE_PERSONAS) {
      const results = this.runInterfaceSimulation(persona);

      // Sanitize filename: lowercase and replace spaces with underscores
      const safeName = persona.name.toLowerCase().replaceAll(/\s+/g, '_');
      const filePath = path.join(dataDir, `${safeName}_data.json`);

      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

      // Execute Python plotter script
      const pythonCmd = `python3 "${plotterPath}" "${filePath}" "${persona.name} (${persona.description})"`;
      exec(pythonCmd, (err) => {
        if (err) this.logger.error(`Plotter Error: ${err.message}`);
      });
    }

    return {
      message: 'Batch simulation successful.',
      count: MARKETPLACE_PERSONAS.length,
    };
  }

  /**
   * Simulates 2 years (730 days) of activity for a specific persona.
   */
  private runInterfaceSimulation(persona: PersonaBehavior): SimulationResult[] {
    const config = this.configService.get<ReputationConfig>('reputation');

    // Initialize state using the specific verification status defined in the persona
    let state: ReputationState = {
      alpha: config?.priors?.alpha ?? 2,
      beta: config?.priors?.beta ?? 1,
      tradeCount: 0,
      penaltyWeight: 0,
      isEmailVerified: persona.isEmailVerified,
      isPhoneVerified: persona.isPhoneVerified,
    };

    const history: SimulationResult[] = [];

    for (let day = 1; day <= 730; day++) {
      // 1. Apply shared decay logic for alpha/beta/trades
      const decayedBase = this.reputationService.applyDecay(state, 1);

      // 2. Apply penalty weight decay manually for the simulation
      // Based on the same half-life logic used in the main service
      const penaltyHalfLife = config?.decay?.penaltyHalfLifeDays || 30;
      const penaltyDecayFactor = Math.pow(0.5, 1 / penaltyHalfLife);
      const newPenaltyWeight = state.penaltyWeight * penaltyDecayFactor;

      state = {
        ...decayedBase,
        penaltyWeight: newPenaltyWeight,
      };

      // 3. Process the day's events based on persona behavior
      const eventLabel = this.processProbabilisticDay(persona, day, state);

      // 4. Record snapshot
      history.push({
        day,
        alpha: Number(state.alpha.toFixed(4)),
        beta: Number(state.beta.toFixed(4)),
        penaltyWeight: Number(state.penaltyWeight.toFixed(4)),
        score: this.reputationService.calculateScore(state),
        event: eventLabel,
      });
    }
    return history;
  }

  /**
   * Determines what happens on a given day based on probabilities.
   */
  private processProbabilisticDay(
    persona: PersonaBehavior,
    day: number,
    state: ReputationState,
  ): string {
    const config = this.configService.get<ReputationConfig>('reputation');

    // Check for scheduled inactivity
    const isInactive = persona.inactivityPeriods?.some(
      (p) => day >= p.startDay && day <= p.endDay,
    );
    if (isInactive) return 'Inactive';

    // Check if any trade activity happens today
    if (Math.random() > persona.tradeFrequency) return 'No Activity';

    // Handle Disputes
    // In the simulation, we assume a "Medium" severity impact for probabilistic disputes
    if (Math.random() < persona.disputeProbability) {
      // Fetch the absolute impact for 'medium' severity from the updated config
      const mediumImpact = config?.penalties?.severities?.medium ?? 0.1;
      state.penaltyWeight += mediumImpact;
      return 'Dispute';
    }

    // Handle Success vs Failure
    if (Math.random() < persona.tradeCompletionRate) {
      state.alpha += 1;
      state.tradeCount += 1;
      return 'Success';
    } else {
      state.beta += 1;
      return 'Failure';
    }
  }
}
