import { Injectable, Logger } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
  private readonly logger = new Logger(ReputationSimulatorService.name);
  private readonly DECAY_FACTOR = Math.exp(-Math.log(2) / 180); // 6-month half-life [4]

  constructor(private readonly reputationService: ReputationService) {}

  /**
   * Batch execution: Saves data to scripts/simulator_plotter/data/
   * Triggers Python visualization for each persona. [1]
   */
  public runFullBatchSimulation() {
    const personas = ['BOMBER', 'REDEMPTION', 'INCONSISTENT'];
    const scriptsDir = path.join(process.cwd(), 'scripts', 'simulator_plotter');
    const dataDir = path.join(scriptsDir, 'data');
    const plotterPath = path.join(scriptsDir, 'reputation_plotter.py');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    for (const persona of personas) {
      const results = this.runPersonaSimulation(persona);
      const fileName = `${persona.toLowerCase()}_data.json`;
      const filePath = path.join(dataDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

      // Trigger Python Script (non-blocking shell execution)
      const pythonCmd = `python3 "${plotterPath}" "${filePath}" "${persona} Persona"`;

      exec(pythonCmd, (error) => {
        if (error)
          this.logger.error(
            `Python Plotter Error (${persona}): ${error.message}`,
          );
      });

      this.logger.log(
        `Simulation complete for ${persona}. Data saved to data/${fileName}`,
      );
    }

    return {
      message: 'Batch simulation successful. Check your screen for graphs.',
    };
  }

  private runPersonaSimulation(persona: string): SimulationResult[] {
    let state = { alpha: 1, beta: 1, tradeCount: 0, penalties: 0 };
    const history: SimulationResult[] = [];

    for (let day = 1; day <= 365; day++) {
      state = this.applyDailyDecay(state);
      const eventLabel = this.applyPersonaBehavior(persona, day, state);
      history.push(this.captureSnapshot(day, state, eventLabel));
    }
    return history;
  }

  private applyDailyDecay(state: InternalSimState): InternalSimState {
    return {
      ...state,
      alpha: 1 + (state.alpha - 1) * this.DECAY_FACTOR,
      beta: 1 + (state.beta - 1) * this.DECAY_FACTOR,
    };
  }

  /**
   * Decoupled Behavioral Sub-functions for reduced complexity. [1]
   */
  private applyPersonaBehavior(
    persona: string,
    day: number,
    state: InternalSimState,
  ): string {
    switch (persona) {
      case 'BOMBER':
        return this.simulateBomber(day, state);
      case 'REDEMPTION':
        return this.simulateRedemption(day, state);
      case 'INCONSISTENT':
        return this.simulateInconsistent(day, state);
      default:
        return 'No Activity';
    }
  }

  private simulateBomber(day: number, state: InternalSimState): string {
    if (day <= 10) {
      for (let i = 0; i < 10; i++) {
        state.alpha += 1;
        state.tradeCount += 1;
      }
      return 'Reputation Bombing';
    }
    return 'No Activity';
  }

  private simulateRedemption(day: number, state: InternalSimState): string {
    if (day === 1) {
      state.beta += 10;
      return 'Initial Major Failure';
    }
    if (day > 30 && day % 15 === 0) {
      state.alpha += 1;
      state.tradeCount += 1;
      return 'Recovery Trade';
    }
    return 'No Activity';
  }

  private simulateInconsistent(day: number, state: InternalSimState): string {
    if (day % 7 === 0) {
      const isSuccess = Math.random() > 0.3;
      if (isSuccess) state.alpha += 1;
      else state.beta += 1;
      state.tradeCount += 1;
      return isSuccess ? 'Success' : 'Failure';
    }
    return 'No Activity';
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
