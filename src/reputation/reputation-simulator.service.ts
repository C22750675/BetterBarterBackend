import { Injectable, Logger } from '@nestjs/common';
import { ReputationService, ReputationState } from './reputation.service';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

  constructor(private readonly reputationService: ReputationService) {}

  public runFullBatchSimulation() {
    const personas: PersonaBehavior[] = [
      {
        name: 'THE_PROFESSIONAL',
        description: 'High volume, consistent quality',
        tradeFrequency: 0.8,
        tradeCompletionRate: 0.99,
        disputeProbability: 0.001,
      },
      {
        name: 'THE_GHOST',
        description: '30 days active, then decays to baseline',
        tradeFrequency: 0.9,
        tradeCompletionRate: 0.95,
        disputeProbability: 0.01,
        inactivityPeriods: [{ startDay: 31, endDay: 365 }],
      },
      {
        name: 'THE_SCAMMER',
        description: 'High volume of disputes and failures',
        tradeFrequency: 0.6,
        tradeCompletionRate: 0.3,
        disputeProbability: 0.2,
      },
    ];

    const scriptsDir = path.join(process.cwd(), 'scripts', 'simulator_plotter');
    const dataDir = path.join(scriptsDir, 'data');
    const plotterPath = path.join(scriptsDir, 'reputation_plotter.py');

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    for (const persona of personas) {
      const results = this.runInterfaceSimulation(persona);
      const fileName = `${persona.name.toLowerCase()}_data.json`;
      const filePath = path.join(dataDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

      const pythonCmd = `python3 "${plotterPath}" "${filePath}" "${persona.name} (Unified Algo Logic)"`;
      exec(pythonCmd, (err) => {
        if (err)
          this.logger.error(
            `Python Plotter Error (${persona.name}): ${err.message}`,
          );
      });

      this.logger.log(`Simulation complete for ${persona.name}`);
    }

    return { message: 'Batch simulation successful.' };
  }

  private runInterfaceSimulation(persona: PersonaBehavior): SimulationResult[] {
    // Shared state structure used by the real algo
    let state: ReputationState = {
      alpha: 1,
      beta: 1,
      tradeCount: 0,
      penalties: 0,
      isEmailVerified: false,
      isPhoneVerified: false,
    };

    const history: SimulationResult[] = [];

    for (let day = 1; day <= 365; day++) {
      // Use the SHARED decay logic from ReputationService
      state = this.reputationService.applyDecay(state);

      const eventLabel = this.processProbabilisticDay(persona, day, state);

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

  private processProbabilisticDay(
    persona: PersonaBehavior,
    day: number,
    state: ReputationState,
  ): string {
    const isInactive = persona.inactivityPeriods?.some(
      (p) => day >= p.startDay && day <= p.endDay,
    );
    if (isInactive) return 'Inactive';

    if (Math.random() > persona.tradeFrequency) return 'No Activity';

    const isDispute = Math.random() < persona.disputeProbability;
    if (isDispute) {
      state.penalties += 0.1;
      return 'Dispute';
    }

    const isSuccess = Math.random() < persona.tradeCompletionRate;
    if (isSuccess) {
      state.alpha += 1;
      state.tradeCount += 1;
      return 'Success';
    } else {
      state.beta += 1;
      return 'Failure';
    }
  }
}
