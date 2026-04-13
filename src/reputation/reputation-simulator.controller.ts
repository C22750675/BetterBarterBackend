import { Controller, Get } from '@nestjs/common';
import { ReputationSimulatorService } from './reputation-simulator.service.js';

@Controller('reputation-simulator')
export class ReputationSimulatorController {
  constructor(private readonly simulator: ReputationSimulatorService) {}

  @Get('run')
  runBatch() {
    return this.simulator.runFullBatchSimulation();
  }
}
