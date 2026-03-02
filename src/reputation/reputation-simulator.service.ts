import { Injectable, Logger } from '@nestjs/common';
import {
  ReputationConfig,
  ReputationService,
  ReputationState,
} from './reputation.service';
import { ConfigService } from '@nestjs/config';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MARKETPLACE_PERSONAS } from './types/personas.types';

export interface PersonaBehavior {
  name: string;
  description: string;
  tradeFrequency: number;
  tradeCompletionRate: number;
  disputeProbability: number;
  inactivityPeriods?: { startDay: number; endDay: number }[];
}

export interface SimulationResult {
  day: number;
  alpha: number;
  beta: number;
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
    let state: ReputationState = {
      alpha: config?.priors?.alpha ?? 2,
      beta: config?.priors?.beta ?? 1,
      tradeCount: 0,
      penalties: 0,
      isEmailVerified: true, // Assuming email is verified for sim focus
      isPhoneVerified: false,
    };

    const history: SimulationResult[] = [];

    for (let day = 1; day <= 730; day++) {
      // 1. Apply shared decay logic from the main service
      state = this.reputationService.applyDecay(state);

      // 2. Process the day's events based on persona behavior
      const eventLabel = this.processProbabilisticDay(persona, day, state);

      // 3. Record snapshot
      history.push({
        day,
        alpha: Number(state.alpha.toFixed(4)),
        beta: Number(state.beta.toFixed(4)),
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
    // Check for scheduled inactivity
    const isInactive = persona.inactivityPeriods?.some(
      (p) => day >= p.startDay && day <= p.endDay,
    );
    if (isInactive) return 'Inactive';

    // Check if any trade activity happens today
    if (Math.random() > persona.tradeFrequency) return 'No Activity';

    // Handle Disputes
    if (Math.random() < persona.disputeProbability) {
      const config = this.configService.get<ReputationConfig>('reputation');
      state.penalties += config?.penalties?.defaultImpact ?? 0.05;
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
